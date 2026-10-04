"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CustomerHeader } from "@/components/CustomerHeader";
import { ProductCard } from "@/components/ProductCard";

interface Store {
  id: string; name: string; category: string; icon: string; open: boolean;
  openTime: string; closeTime: string; address: string | null; description: string | null;
  products: { id: string; name: string; price: number; icon: string; isAvailable: boolean; featured: boolean; storeId: string }[];
}

export default function StoreDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);

  useEffect(() => {
    fetch(`/api/stores/${id}`)
      .then((r) => r.json())
      .then((d) => setStore(d.store));
  }, [id]);

  if (!store) {
    return (
      <div>
        <CustomerHeader />
        <p className="py-10 text-center text-sm text-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="pb-10">
      <CustomerHeader />
      <main className="mx-auto max-w-2xl px-4 py-4">
        <button onClick={() => router.back()} className="mb-3 text-sm font-medium text-muted">← Back</button>
        <div className="mb-4 flex items-center gap-3 rounded-3xl border border-border bg-white p-4 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blush text-3xl">{store.icon}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-serif text-lg font-semibold text-ink">{store.name}</p>
            <p className="text-xs text-muted">{store.category}</p>
            <p className="text-xs text-muted">
              🕐 {store.openTime} – {store.closeTime} {!store.open && <span className="font-semibold text-amber-700">· Closed</span>}
            </p>
          </div>
        </div>
        {store.description && <p className="mb-4 text-sm text-ink/80">{store.description}</p>}

        <p className="mb-2 font-serif text-base font-semibold text-ink">Gifts from {store.name}</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {store.products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
          {store.products.length === 0 && <p className="col-span-full py-6 text-center text-sm text-muted">No products yet.</p>}
        </div>
      </main>
    </div>
  );
}
