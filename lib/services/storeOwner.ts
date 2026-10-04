import "server-only";
import { getDb } from "@/lib/db";
import { NotFoundError } from "@/lib/api-errors";
import { ForbiddenError } from "@/lib/session";

export async function getMyStoreId(userId: string): Promise<string | null> {
  const me = await getDb().user.findUnique({ where: { id: userId } });
  return me?.storeId ?? null;
}

export async function getMyStore(storeId: string) {
  const store = await getDb().store.findUnique({ where: { id: storeId }, include: { products: true } });
  if (!store) throw new NotFoundError("Store not found.");
  return store;
}

export async function updateStoreProfile(storeId: string, input: Partial<{
  name: string; description: string; address: string; openTime: string; closeTime: string; open: boolean;
}>) {
  return getDb().store.update({
    where: { id: storeId },
    data: {
      ...(input.name ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.address !== undefined ? { address: input.address } : {}),
      ...(input.openTime ? { openTime: input.openTime } : {}),
      ...(input.closeTime ? { closeTime: input.closeTime } : {}),
      ...(input.open !== undefined ? { open: input.open } : {}),
    },
  });
}

// storeId is the acting store owner's own store — verified by the caller so
// one store owner can't edit another store's products via a guessed id.
export async function updateMyProduct(storeId: string, productId: string, input: Partial<{
  name: string; description: string; price: number; featured: boolean; isAvailable: boolean;
}>) {
  const db = getDb();
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) throw new NotFoundError("Product not found.");
  if (product.storeId !== storeId) throw new ForbiddenError("This product belongs to a different store.");

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

export async function setAllProductsAvailability(storeId: string, isAvailable: boolean) {
  const db = getDb();
  await db.product.updateMany({ where: { storeId }, data: { isAvailable } });
  return db.product.findMany({ where: { storeId } });
}
