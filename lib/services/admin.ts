import "server-only";
import { getDb } from "@/lib/db";
import { NotFoundError } from "@/lib/api-errors";

// Unlike storeOwner.updateMyProduct, these admin variants don't check which
// store owns the product/order — the /api/admin/** routes are already
// gated to the ADMIN role by middleware.
export async function adminUpdateProduct(productId: string, input: Partial<{
  name: string; description: string; price: number; featured: boolean; isAvailable: boolean;
}>) {
  const db = getDb();
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) throw new NotFoundError("Product not found.");
  return db.product.update({
    where: { id: productId },
    data: {
      ...(input.name ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.featured !== undefined ? { featured: input.featured } : {}),
      ...(input.isAvailable !== undefined ? { isAvailable: input.isAvailable } : {}),
    },
  });
}

export async function adminUpdateStore(storeId: string, input: Partial<{ open: boolean }>) {
  const db = getDb();
  const store = await db.store.findUnique({ where: { id: storeId } });
  if (!store) throw new NotFoundError("Store not found.");
  return db.store.update({
    where: { id: storeId },
    data: { ...(input.open !== undefined ? { open: input.open } : {}) },
  });
}

export async function adminReturnsAnalytics() {
  const db = getDb();
  const orders = await db.order.findMany({
    include: { items: { include: { product: { include: { store: true } } } } },
  });
  const stores = await db.store.findMany();

  type OrderRow = { status: string; rejectionReason: string | null; createdAt: Date; items: { product: { store: { id: string } } }[] };
  type StoreRow = { id: string; name: string };
  type StoreStat = { name: string; pct: number; count: number; orderCount: number };

  const rejected = (orders as OrderRow[]).filter((o) => o.status === "REJECTED");
  const total = orders.length || 1;
  const returnRate = Number(((rejected.length / total) * 100).toFixed(1));

  const reasonCounts: Record<string, number> = {};
  for (const o of rejected) {
    const reason = (o.rejectionReason || "Unspecified").trim();
    reasonCounts[reason] = (reasonCounts[reason] ?? 0) + 1;
  }
  const topReasons = Object.entries(reasonCounts)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);

  const byStore: StoreStat[] = (stores as StoreRow[]).map((s) => {
    const storeOrders = (orders as OrderRow[]).filter((o) => o.items[0]?.product?.store?.id === s.id);
    const storeRejected = storeOrders.filter((o) => o.status === "REJECTED");
    return {
      name: s.name,
      pct: storeOrders.length ? (storeRejected.length / storeOrders.length) * 100 : 0,
      count: storeRejected.length,
      orderCount: storeOrders.length,
    };
  });
  const rejectionsByStore = [...byStore].sort((a, b) => b.pct - a.pct).slice(0, 6);
  const worstStore = byStore.reduce((a, b) => (b.pct > a.pct ? b : a), { pct: -1, name: "", count: 0, orderCount: 0 } as StoreStat);
  const busiestStore = byStore.reduce((a, b) => (b.orderCount > a.orderCount ? b : a), { orderCount: -1, name: "", pct: 0, count: 0 } as StoreStat);

  // Daily rejection counts for the last 7 days (for a simple sparkline).
  const days: { label: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const count = rejected.filter((o) => o.createdAt.toISOString().slice(0, 10) === key).length;
    days.push({ label: key, count });
  }

  return { returnRate, rejectedCount: rejected.length, trend: days, topReasons, rejectionsByStore, worstStore, busiestStore };
}

export async function adminDashboardStats() {
  const db = getDb();
  const [storeCount, productCount, orderCount, orders] = await Promise.all([
    db.store.count(),
    db.product.count(),
    db.order.count(),
    db.order.findMany({ select: { status: true, total: true, createdAt: true } }),
  ]);
  const byStatus: Record<string, number> = {};
  let revenue = 0;
  for (const o of orders) {
    byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
    if (o.status === "DELIVERED") revenue += o.total;
  }
  return { storeCount, productCount, orderCount, revenue, byStatus };
}
