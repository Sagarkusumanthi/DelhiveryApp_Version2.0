"use client";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils";

interface Product { id: string; name: string; description: string | null; price: number; icon: string; featured: boolean; isAvailable: boolean }

export default function StoreProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: "", description: "", price: 0, featured: false });

  function load() {
    fetch("/api/store/products").then((r) => r.json()).then((d) => setProducts(d.products ?? []));
  }
  useEffect(load, []);

  function startEdit(p: Product) {
    setEditingId(p.id);
    setDraft({ name: p.name, description: p.description ?? "", price: p.price, featured: p.featured });
  }

  async function saveEdit(id: string) {
    await fetch(`/api/store/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    setEditingId(null);
    load();
  }

  async function toggle(id: string, field: "isAvailable" | "featured", value: boolean) {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
    await fetch(`/api/store/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
  }

  async function toggleAllAvailability(isAvailable: boolean) {
    setProducts((prev) => prev.map((p) => ({ ...p, isAvailable })));
    await fetch("/api/store/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable }),
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-serif text-xl font-semibold text-ink">Products</h1>
        <label className="flex items-center gap-2 text-xs font-semibold text-ink">
          <input type="checkbox" onChange={(e) => toggleAllAvailability(e.target.checked)} />
          Mark all available
        </label>
      </div>
      <div className="space-y-2">
        {products.map((p) => (
          <div key={p.id} className="rounded-2xl border border-border bg-white p-4">
            {editingId === p.id ? (
              <div className="space-y-2">
                <Input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Product name" />
                <Input value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} placeholder="Description" />
                <Input
                  type="number"
                  value={draft.price}
                  onChange={(e) => setDraft((d) => ({ ...d, price: Number(e.target.value) }))}
                  placeholder="Price"
                />
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={draft.featured}
                    onChange={(e) => setDraft((d) => ({ ...d, featured: e.target.checked }))}
                  />
                  Featured on home page
                </label>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => saveEdit(p.id)}>Save changes</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blush text-xl">{p.icon}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{p.name}</p>
                  <p className="text-sm text-muted">{formatINR(p.price)}</p>
                </div>
                <div className="flex flex-col items-end gap-1 text-[11px] font-semibold">
                  <label className="flex items-center gap-1">
                    <input type="checkbox" checked={p.isAvailable} onChange={(e) => toggle(p.id, "isAvailable", e.target.checked)} />
                    Available
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="checkbox" checked={p.featured} onChange={(e) => toggle(p.id, "featured", e.target.checked)} />
                    Featured
                  </label>
                </div>
                <button onClick={() => startEdit(p)} className="text-xs font-semibold text-rose">Edit</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
