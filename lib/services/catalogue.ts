import "server-only";
import { getDb } from "@/lib/db";
import { NotFoundError } from "@/lib/api-errors";

export async function listCities() {
  return getDb().city.findMany({ orderBy: { name: "asc" } });
}

export async function listCategories() {
  return getDb().category.findMany();
}

export async function listStores(filters: { cityId?: string; category?: string }) {
  return getDb().store.findMany({
    where: {
      ...(filters.cityId ? { cityId: filters.cityId } : {}),
      ...(filters.category ? { category: filters.category } : {}),
    },
    orderBy: { name: "asc" },
  });
}

export async function getStore(id: string) {
  const store = await getDb().store.findUnique({ where: { id }, include: { products: true, city: true } });
  if (!store) throw new NotFoundError("Store not found.");
  return store;
}

export async function listProducts(filters: { storeId?: string; featured?: boolean; cityId?: string; category?: string }) {
  return getDb().product.findMany({
    where: {
      ...(filters.storeId ? { storeId: filters.storeId } : {}),
      ...(filters.featured !== undefined ? { featured: filters.featured } : {}),
      store: {
        ...(filters.cityId ? { cityId: filters.cityId } : {}),
        ...(filters.category ? { category: filters.category } : {}),
      },
    },
    include: { store: true },
  });
}

export async function getProduct(id: string) {
  const product = await getDb().product.findUnique({ where: { id }, include: { store: true } });
  if (!product) throw new NotFoundError("Product not found.");
  return product;
}
