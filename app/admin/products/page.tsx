"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatINR } from "@/lib/utils";

interface Product { id: string; name: string; price: number; icon: string; featured: boolean; isAvailable: boolean; store: { name: string } }

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);

  function load() {
    fetch("/api/products").then((r) => r.json()).then((d) => setProducts(d.products ?? []));
  }
  useEffect(load, []);

  async function toggle(e: React.MouseEvent, id: string, field: "isAvailable" | "featured", value: boolean) {
    e.stopPropagation();
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
    await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
  }

  return (
    <div>
      <h1 className="mb-4 font-serif text-xl font-semibold text-ink">Products</h1>
      <div className="space-y-2">
        {products.map((p) => (
          <div
            key={p.id}
            role="button"
            tabIndex={0}
            onClick={() => router.push(`/admin/products/${p.id}`)}
            onKeyDown={(e) => { if (e.key === "Enter") router.push(`/admin/products/${p.id}`); }}
            className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-border bg-white p-4 text-left"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blush text-xl">{p.icon}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{p.name}</p>
              <p className="text-xs text-muted">{p.store.name} · {formatINR(p.price)}</p>
            </div>
            <div className="flex flex-col items-end gap-1 text-[11px] font-semibold" onClick={(e) => e.stopPropagation()}>
              <label className="flex items-center gap-1">
                <input type="checkbox" checked={p.isAvailable} onChange={(e) => toggle(e as any, p.id, "isAvailable", e.target.checked)} />
                Available
              </label>
              <label className="flex items-center gap-1">
                <input type="checkbox" checked={p.featured} onChange={(e) => toggle(e as any, p.id, "featured", e.target.checked)} />
                Featured
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
