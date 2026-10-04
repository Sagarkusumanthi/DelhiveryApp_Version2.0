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
