"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils";

interface ProductDetail {
  product: {
    id: string; name: string; price: number; icon: string; description: string | null;
    isAvailable: boolean; featured: boolean; storeId: string; store: { id: string; name: string };
  };
  timesOrdered: number; unitsSold: number; revenue: number;
}

export default function AdminProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<ProductDetail | null>(null);

  function load() {
    fetch(`/api/admin/products/${id}`).then((r) => r.json()).then(setData);
  }
  useEffect(load, [id]);

  async function toggle(field: "isAvailable" | "featured", value: boolean) {
    if (!data) return;
    setData({ ...data, product: { ...data.product, [field]: value } });
    await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
  }

  if (!data) return <p className="py-10 text-center text-sm text-muted">Loading…</p>;
  const { product } = data;

  return (
    <div className="mx-auto max-w-md">
      <button onClick={() => router.push("/admin/products")} className="mb-3 text-sm font-medium text-muted">← Back</button>
      <p className="mb-3 font-serif text-lg font-bold text-ink">Product Details</p>

      <div className="mb-3 flex items-center gap-3 rounded-2xl border border-border bg-white p-4">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-blush text-2xl">{product.icon}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-ink">{product.name}</p>
          <p className="text-xs text-muted">{formatINR(product.price)}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${product.isAvailable ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {product.isAvailable ? "Available" : "Unavailable"}
        </span>
      </div>

      {product.description && (
        <div className="mb-3 rounded-2xl border border-border bg-white p-4">
          <p className="mb-1 text-[10px] font-bold uppercase text-muted">Description</p>
          <p className="text-sm">{product.description}</p>
        </div>
      )}

      <button
        onClick={() => router.push(`/admin/stores/${product.storeId}`)}
        className="mb-3 flex w-full items-center justify-between rounded-2xl border border-border bg-white p-4 text-left"
      >
        <span className="flex items-center gap-2">
          <span>🏪</span>
          <span>
            <span className="block text-[10px] font-bold uppercase text-muted">Sold by</span>
            <span className="block text-sm font-bold text-ink">{product.store.name}</span>
          </span>
        </span>
        <span className="text-muted">›</span>
      </button>

      <div className="mb-3 space-y-2.5 rounded-2xl border border-border bg-white p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Available for sale</span>
          <label className="relative inline-flex h-[22px] w-10 cursor-pointer items-center">
            <input type="checkbox" checked={product.isAvailable} onChange={(e) => toggle("isAvailable", e.target.checked)} className="peer sr-only" />
            <span className="absolute inset-0 rounded-full bg-neutral-300 transition peer-checked:bg-emerald-500" />
            <span className="absolute left-[3px] h-4 w-4 rounded-full bg-white transition peer-checked:left-[21px]" />
          </label>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-2.5">
          <span className="text-sm font-semibold">Featured on home page</span>
          <label className="relative inline-flex h-[22px] w-10 cursor-pointer items-center">
            <input type="checkbox" checked={product.featured} onChange={(e) => toggle("featured", e.target.checked)} className="peer sr-only" />
            <span className="absolute inset-0 rounded-full bg-neutral-300 transition peer-checked:bg-emerald-500" />
            <span className="absolute left-[3px] h-4 w-4 rounded-full bg-white transition peer-checked:left-[21px]" />
          </label>
        </div>
      </div>

      <div className="mb-3 rounded-2xl border border-border bg-white p-4">
        <p className="mb-2.5 text-sm font-bold text-ink">Performance (real data from your orders)</p>
        <div className="flex justify-between text-center">
          <div className="flex-1"><p className="text-lg font-bold">{data.timesOrdered}</p><p className="text-[10px] text-muted">Times ordered</p></div>
          <div className="flex-1"><p className="text-lg font-bold">{data.unitsSold}</p><p className="text-[10px] text-muted">Units delivered</p></div>
          <div className="flex-1"><p className="text-base font-bold">{formatINR(data.revenue)}</p><p className="text-[10px] text-muted">Revenue</p></div>
        </div>
      </div>
    </div>
  );
}
