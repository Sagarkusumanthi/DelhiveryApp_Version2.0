import "server-only";
import { randomUUID } from "crypto";
import { getDb } from "@/lib/db";
import { calculateTotals } from "@/lib/services/pricing";
import { isValidStoreTransition } from "@/lib/services/orderStateMachine";
import { NotFoundError, ConflictError } from "@/lib/api-errors";
import type { CheckoutInput } from "@/lib/validation";

const ORDER_INCLUDE = {
  items: { include: { product: true } },
  OrderStatusHistory: { orderBy: { changedAt: "asc" as const } },
  customer: true,
  Store: true,
  City: true,
};

function mapOrder(order: any) {
  return {
    ...order,
    code: order.orderCode,
    recipientAddress: order.deliveryAddress,
    message: order.giftMessage,
    sender: order.senderName,
    createdAt: order.placedAt,
    total: Number(order.total),
    subtotal: Number(order.subtotal),
    deliveryFee: Number(order.deliveryFee),
    items: order.items?.map((item: any) => ({
      ...item,
      qty: item.quantity,
      priceAtOrder: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal),
      product: item.product ? { ...item.product, price: Number(item.product.price), icon: item.product.imageUrl } : item.product,
    })),
    history: order.OrderStatusHistory,
  };
}

function mapRole(role?: string): "CUSTOMER" | "STORE_OWNER" | "ADMIN" {
  if (role === "ADMIN") return "ADMIN";
  if (role === "CUSTOMER") return "CUSTOMER";
  return "STORE_OWNER";
}

export async function listOrdersForCustomer(customerId: string) {
  const rows = await getDb().order.findMany({ where: { customerId }, include: ORDER_INCLUDE, orderBy: { placedAt: "desc" } });
  return rows.map(mapOrder);
}

export async function listOrdersForStore(storeId: string) {
  const rows = await getDb().order.findMany({ where: { storeId }, include: ORDER_INCLUDE, orderBy: { placedAt: "desc" } });
  return rows.map(mapOrder);
}

export async function listAllOrders() {
  const rows = await getDb().order.findMany({ include: ORDER_INCLUDE, orderBy: { placedAt: "desc" } });
  return rows.map(mapOrder);
}

export async function getOrder(id: string) {
  const order = await getDb().order.findUnique({ where: { id }, include: ORDER_INCLUDE });
  if (!order) throw new NotFoundError("Order not found.");
  return mapOrder(order);
}

export async function createOrder({ customerId, input }: { customerId: string; input: CheckoutInput }) {
  const db = getDb();
  const products = await db.product.findMany({
    where: { id: { in: input.items.map((i) => i.productId) } },
    include: { store: true },
  });
  if (products.length !== input.items.length) throw new ConflictError("One or more items are no longer available.");

  const priced = input.items.map((i) => ({
    ...i,
    price: Number(products.find((p) => p.id === i.productId)!.price),
  }));
  const { subtotal, deliveryFee, total } = calculateTotals(priced, input.deliveryOption);
  const firstProduct = products[0];
  const paymentMethod = input.paymentMethod === "COD" ? "COD" : "UPI_MOCK";
  const now = new Date();

  const order = await db.order.create({
    data: {
      orderCode: `GF-${Date.now().toString(36).toUpperCase()}`,
      customerId,
      storeId: firstProduct.storeId,
      cityId: firstProduct.store.cityId,
      status: "ORDER_PLACED",
      recipientName: `${input.recipientFirstName} ${input.recipientLastName}`,
      recipientPhone: input.recipientPhone,
      deliveryAddress: input.recipientAddress,
      occasion: input.occasion ?? "OTHER",
      giftMessage: input.message || null,
      senderName: input.sender || "",
      deliveryOption: input.deliveryOption,
      paymentMethod,
      subtotal,
      deliveryFee,
      total,
      idempotencyKey: randomUUID(),
      updatedAt: now,
      items: {
        create: input.items.map((i) => {
          const product = products.find((p) => p.id === i.productId)!;
          const unitPrice = Number(product.price);
          return { productId: product.id, productName: product.name, unitPrice, quantity: i.qty, lineTotal: unitPrice * i.qty };
        }),
      },
      OrderStatusHistory: {
        create: [{ id: randomUUID(), status: "ORDER_PLACED", changedByRole: "CUSTOMER" }],
      },
    },
    include: ORDER_INCLUDE,
  });
  return mapOrder(order);
}

export async function transitionOrderStatus(orderId: string, { status, reason, role }: { status: string; reason?: string; role?: string }) {
  const db = getDb();
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError("Order not found.");
  if (!isValidStoreTransition(order.status, status)) throw new ConflictError(`Cannot move from ${order.status} to ${status}.`);
  if (status === "REJECTED" && (!reason || reason.trim().length < 3)) throw new ConflictError("A rejection reason of at least 3 characters is required.");

  const updated = await db.order.update({
    where: { id: order.id },
    data: {
      status: status as any,
      ...(status === "REJECTED" ? { rejectionReason: reason } : {}),
      updatedAt: new Date(),
      OrderStatusHistory: { create: [{ id: randomUUID(), previousStatus: order.status, status: status as any, changedByRole: mapRole(role), note: status === "REJECTED" ? reason : undefined }] },
    },
    include: ORDER_INCLUDE,
  });
  return mapOrder(updated);
}

export async function overrideOrderStatus(orderId: string, { targetStatus, reason }: { targetStatus: string; reason: string }) {
  const db = getDb();
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError("Order not found.");

  const updated = await db.order.update({
    where: { id: order.id },
    data: {
      status: targetStatus as any,
      ...(targetStatus === "REJECTED" ? { rejectionReason: reason } : {}),
      updatedAt: new Date(),
      OrderStatusHistory: { create: [{ id: randomUUID(), previousStatus: order.status, status: targetStatus as any, changedByRole: "ADMIN", note: reason, isAdminOverride: true }] },
    },
    include: ORDER_INCLUDE,
  });
  return mapOrder(updated);
}

export async function confirmDelivery(orderId: string, { confirmed }: { confirmed: boolean; photoDataUrl?: string }) {
  const db = getDb();
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError("Order not found.");

  if (order.status !== "DELIVERED") {
    if (!isValidStoreTransition(order.status, "DELIVERED")) throw new ConflictError(`Cannot confirm delivery from status ${order.status}.`);
    await db.order.update({
      where: { id: order.id },
      data: {
        status: "DELIVERED",
        updatedAt: new Date(),
        OrderStatusHistory: { create: [{ id: randomUUID(), previousStatus: order.status, status: "DELIVERED", changedByRole: "CUSTOMER" }] },
      },
    });
  }

  const updated = await db.order.update({
    where: { id: order.id },
    data: { deliveryConfirmedByCustomer: !!confirmed, updatedAt: new Date() },
    include: ORDER_INCLUDE,
  });
  return mapOrder(updated);
}
