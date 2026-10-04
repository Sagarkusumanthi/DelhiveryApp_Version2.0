import { Router } from 'express';
import { prisma } from '../prisma';
import { DELIVERY_FEES, STORE_NEXT } from '../types';

export const ordersRouter = Router();

const ORDER_INCLUDE = {
  items: { include: { product: true } },
  history: { orderBy: { at: 'asc' as const } },
  customer: true,
};

// GET /api/orders?customerId=&storeId=&status=
// storeId filters to orders that contain at least one product from that store
// (mirrors the prototype's myStoreOrders(), which looked at the order's
// primary product to find its owning store).
ordersRouter.get('/', async (req, res) => {
  const { customerId, storeId, status } = req.query as {
    customerId?: string;
    storeId?: string;
    status?: string;
  };

  const orders = await prisma.order.findMany({
    where: {
      ...(customerId ? { customerId } : {}),
      ...(status ? { status: status as any } : {}),
      ...(storeId ? { items: { some: { product: { storeId } } } } : {}),
    },
    include: ORDER_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
  res.json(orders);
});

ordersRouter.get('/:id', async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: ORDER_INCLUDE,
  });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

// POST /api/orders
// body: { customerId, items: [{ productId, qty }], recipient: { name, phone, address },
//         occasion, message, sender, deliveryOption, paymentMethod }
ordersRouter.post('/', async (req, res) => {
  const {
    customerId,
    items,
    recipient,
    occasion,
    message,
    sender,
    deliveryOption,
    paymentMethod,
  } = req.body ?? {};

  if (!customerId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'customerId and at least one item are required' });
  }
  if (!recipient?.name || !recipient?.phone || !recipient?.address) {
    return res.status(400).json({ error: 'recipient.name, recipient.phone and recipient.address are required' });
  }
  if (!DELIVERY_FEES[deliveryOption]) {
    return res.status(400).json({ error: 'deliveryOption must be one of STANDARD, EXPRESS, SCHEDULED' });
  }

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i: any) => i.productId) } },
  });
  if (products.length !== items.length) {
    return res.status(400).json({ error: 'One or more productId values were not found' });
  }

  const subtotal = items.reduce((sum: number, i: any) => {
    const product = products.find((p: { id: string }) => p.id === i.productId)!;
    return sum + product.price * i.qty;
  }, 0);
  const total = subtotal + DELIVERY_FEES[deliveryOption];

  const orderCount = await prisma.order.count();
  const code = `GF-${1000 + orderCount + 1}`;

  const order = await prisma.order.create({
    data: {
      code,
      customerId,
      status: 'ORDER_PLACED',
      recipientName: recipient.name,
      recipientPhone: recipient.phone,
      recipientAddress: recipient.address,
      occasion,
      message,
      sender,
      deliveryOption,
      paymentMethod,
      total,
      items: {
        create: items.map((i: any) => {
          const product = products.find((p: { id: string }) => p.id === i.productId)!;
          return { productId: product.id, qty: i.qty, priceAtOrder: product.price };
        }),
      },
      history: {
        create: [{ status: 'ORDER_PLACED', role: 'CUSTOMER' }],
      },
    },
    include: ORDER_INCLUDE,
  });

  res.status(201).json(order);
});

// PATCH /api/orders/:id/status
// body: { status: 'STORE_ACCEPTED' | 'PREPARING_GIFT' | ... | 'REJECTED', reason? }
// Used by the store dashboard to accept, advance, or reject an order.
ordersRouter.patch('/:id/status', async (req, res) => {
  const { status, reason, role } = req.body ?? {};
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const allowed = STORE_NEXT[order.status] ?? [];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `Cannot move from ${order.status} to ${status}` });
  }
  if (status === 'REJECTED' && (!reason || reason.trim().length < 3)) {
    return res.status(400).json({ error: 'A rejection reason of at least 3 characters is required' });
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status,
      ...(status === 'REJECTED' ? { rejectionReason: reason } : {}),
      history: { create: [{ status, role: role ?? 'STORE', reason: status === 'REJECTED' ? reason : undefined }] },
    },
    include: ORDER_INCLUDE,
  });
  res.json(updated);
});

// PATCH /api/orders/:id/override  (admin-only in the UI layer — add auth before exposing publicly)
// body: { targetStatus, reason }
ordersRouter.patch('/:id/override', async (req, res) => {
  const { targetStatus, reason } = req.body ?? {};
  if (!reason || reason.trim().length < 3) {
    return res.status(400).json({ error: 'A reason of at least 3 characters is required' });
  }
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: targetStatus,
      history: { create: [{ status: targetStatus, role: 'ADMIN', reason, override: true }] },
    },
    include: ORDER_INCLUDE,
  });
  res.json(updated);
});

// PATCH /api/orders/:id/delivery-confirmation
// body: { confirmed: true, photoDataUrl? }
ordersRouter.patch('/:id/delivery-confirmation', async (req, res) => {
  const { confirmed, photoDataUrl } = req.body ?? {};
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: {
      deliveryConfirmedByCustomer: !!confirmed,
      ...(photoDataUrl ? { deliveryPhotoDataUrl: photoDataUrl } : {}),
    },
    include: ORDER_INCLUDE,
  });
  res.json(order);
});
