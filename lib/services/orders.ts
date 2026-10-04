import "server-only";
import { getDb } from "@/lib/db";
import { calculateTotals } from "@/lib/services/pricing";
import { isValidStoreTransition } from "@/lib/services/orderStateMachine";
import { NotFoundError, ConflictError } from "@/lib/api-errors";
import type { CheckoutInput } from "@/lib/validation";

const ORDER_INCLUDE = {
  items: { include: { product: true } },
  history: { orderBy: { at: "asc" as const } },
  customer: true,
};

export async function listOrdersForCustomer(customerId: string) {
  return getDb().order.findMany({
    where: { customerId },
    include: ORDER_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}

export async function listOrdersForStore(storeId: string) {
  return getDb().order.findMany({
    where: { items: { some: { product: { storeId } } } },
    include: ORDER_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}

export async function listAllOrders() {
  return getDb().order.findMany({ include: ORDER_INCLUDE, orderBy: { createdAt: "desc" } });
}

export async function getOrder(id: string) {
  const order = await getDb().order.findUnique({ where: { id }, include: ORDER_INCLUDE });
  if (!order) throw new NotFoundError("Order not found.");
  return order;
}

export async function createOrder({ customerId, input }: { customerId: string; input: CheckoutInput }) {
  const db = getDb();
  const products = await db.product.findMany({ where: { id: { in: input.items.map((i) => i.productId) } } });
  if (products.length !== input.items.length) {
    throw new ConflictError("One or more items are no longer available.");
  }

  const priced = input.items.map((i) => ({ ...i, price: products.find((p: { id: string }) => p.id === i.productId)!.price }));
  const { total } = calculateTotals(priced, input.deliveryOption);

  const orderCount = await db.order.count();
  const code = `GF-${1000 + orderCount + 1}`;

  return db.order.create({
    data: {
      code,
      customerId,
      status: "ORDER_PLACED",
      recipientName: `${input.recipientFirstName} ${input.recipientLastName}`,
      recipientPhone: input.recipientPhone,
      recipientAddress: input.recipientAddress,
      occasion: input.occasion,
      message: input.message,
      sender: input.sender,
      deliveryOption: input.deliveryOption,
      paymentMethod: input.paymentMethod,
      total,
      items: {
        create: input.items.map((i) => {
          const product = products.find((p: { id: string }) => p.id === i.productId)!;
          return { productId: product.id, qty: i.qty, priceAtOrder: product.price };
        }),
      },
      history: { create: [{ status: "ORDER_PLACED", role: "CUSTOMER" }] },
    },
    include: ORDER_INCLUDE,
  });
}

export async function transitionOrderStatus(
  orderId: string,
  { status, reason, role }: { status: string; reason?: string; role?: string }
) {
  const db = getDb();
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError("Order not found.");

  if (!isValidStoreTransition(order.status, status)) {
    throw new ConflictError(`Cannot move from ${order.status} to ${status}.`);
  }
  if (status === "REJECTED" && (!reason || reason.trim().length < 3)) {
    throw new ConflictError("A rejection reason of at least 3 characters is required.");
  }

  return db.order.update({
    where: { id: order.id },
    data: {
      status: status as any,
      ...(status === "REJECTED" ? { rejectionReason: reason } : {}),
      history: { create: [{ status, role: role ?? "STORE", reason: status === "REJECTED" ? reason : undefined }] },
    },
    include: ORDER_INCLUDE,
  });
}

export async function overrideOrderStatus(orderId: string, { targetStatus, reason }: { targetStatus: string; reason: string }) {
  const db = getDb();
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError("Order not found.");

  return db.order.update({
    where: { id: order.id },
    data: {
      status: targetStatus as any,
      ...(targetStatus === "REJECTED" ? { rejectionReason: reason } : {}),
      history: { create: [{ status: targetStatus, role: "ADMIN", reason, override: true }] },
    },
    include: ORDER_INCLUDE,
  });
}

export async function confirmDelivery(orderId: string, { confirmed, photoDataUrl }: { confirmed: boolean; photoDataUrl?: string }) {
  const db = getDb();
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError("Order not found.");

  if (order.status !== "DELIVERED") {
    if (!isValidStoreTransition(order.status, "DELIVERED")) {
      throw new ConflictError(`Cannot confirm delivery from status ${order.status}.`);
    }
    await db.order.update({
      where: { id: order.id },
      data: { status: "DELIVERED", history: { create: [{ status: "DELIVERED", role: "CUSTOMER" }] } },
    });
  }

  return db.order.update({
    where: { id: order.id },
    data: {
      deliveryConfirmedByCustomer: !!confirmed,
      ...(photoDataUrl ? { deliveryPhotoDataUrl: photoDataUrl } : {}),
    },
    include: ORDER_INCLUDE,
  });
}
