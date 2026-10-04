import "server-only";
import { getDb } from "@/lib/db";
import { NotFoundError } from "@/lib/api-errors";

function mapProduct(product: any) {
  return { ...product, price: Number(product.price), icon: product.imageUrl, featured: product.isFeatured };
}

function mapStore(store: any) {
  return {
    ...store,
    category: store.Category?.name ?? store.categoryId,
    icon: store.Category?.icon ?? "🎁",
    open: store.isOpen,
    owner: store.User?.name ?? store.ownerUserId,
    products: store.products?.map(mapProduct),
  };
}

export async function listCities() {
  return getDb().city.findMany({ orderBy: { name: "asc" } });
}

export async function listCategories() {
  return getDb().category.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function listStores(filters: { cityId?: string; category?: string }) {
  const stores = await getDb().store.findMany({
    where: {
      ...(filters.cityId ? { cityId: filters.cityId } : {}),
      ...(filters.category ? { Category: { OR: [{ id: filters.category }, { name: filters.category }] } } : {}),
    },
    include: { Category: true, User: true },
    orderBy: { name: "asc" },
  });
  return stores.map(mapStore);
}

export async function getStore(id: string) {
  const store = await getDb().store.findUnique({
    where: { id },
    include: { products: true, city: true, Category: true, User: true },
  });
  if (!store) throw new NotFoundError("Store not found.");
  return mapStore(store);
}

export async function listProducts(filters: { storeId?: string; featured?: boolean; cityId?: string; category?: string }) {
  const products = await getDb().product.findMany({
    where: {
      ...(filters.storeId ? { storeId: filters.storeId } : {}),
      ...(filters.featured !== undefined ? { isFeatured: filters.featured } : {}),
      ...(filters.cityId || filters.category
        ? {
            store: {
              ...(filters.cityId ? { cityId: filters.cityId } : {}),
              ...(filters.category ? { Category: { OR: [{ id: filters.category }, { name: filters.category }] } } : {}),
            },
          }
        : {}),
    },
    include: { store: true },
  });
  return products.map(mapProduct);
}

export async function getProduct(id: string) {
  const product = await getDb().product.findUnique({ where: { id }, include: { store: true } });
  if (!product) throw new NotFoundError("Product not found.");
  return mapProduct(product);
}
