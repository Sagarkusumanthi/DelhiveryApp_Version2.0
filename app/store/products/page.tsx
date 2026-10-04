"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils";

interface Product { id: string; name: string; description: string | null; price: number; icon: string; featured: boolean; isAvailable: boolean }
interface Store { name: string; category: string }

export default function StoreProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [menuTab, setMenuTab] = useState<"items" | "addons">("items");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: "", description: "", price: 0, featured: false });

  function load() {
    fetch("/api/store/products").then((r) => r.json()).then((d) => setProducts(d.products ?? []));
    fetch("/api/store/profile").then((r) => r.json()).then((d) => setStore(d.store));
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

  async function toggleAvailability(id: string, isAvailable: boolean) {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isAvailable } : p)));
    await fetch(`/api/store/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable }),
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

  const inStockCount = products.filter((p) => p.isAvailable).length;
  const allInStock = products.length > 0 && inStockCount === products.length;

  return (
    <div>
      <div className="flex items-center gap-2.5">
        <button onClick={() => router.push("/store/dashboard")} className="text-lg text-ink">←</button>
        <div>
          <p className="text-[10px] uppercase text-muted">Edit menu for</p>
          <p className="font-serif text-base font-bold text-ink">{store?.name}</p>
        </div>
      </div>

      <div className="my-3 flex gap-2 rounded-full bg-blush p-1">
        {(["items", "addons"] as const).map((key) => (
          <button
            key={key}
            onClick={() => setMenuTab(key)}
            className={`flex-1 rounded-full py-1.5 text-xs font-semibold ${menuTab === key ? "bg-ink text-white" : "text-ink"}`}
          >
            {key === "items" ? "All items" : "Add-ons"}
          </button>
        ))}
      </div>

      {menuTab === "addons" ? (
        <div className="rounded-2xl border border-border bg-white p-7 text-center">
          <p className="text-2xl">✨</p>
          <p className="mt-2 font-serif text-base font-semibold text-ink">Add-ons coming soon</p>
          <p className="mt-0.5 text-xs text-muted">Gift wrap and add-on items aren&apos;t part of this MVP yet.</p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-border bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-ink">{store?.category} <span className="font-normal text-muted">({products.length})</span></p>
                <p className="text-xs text-muted">{inStockCount} of {products.length} items in stock</p>
              </div>
              <label className="relative inline-flex h-[22px] w-10 flex-shrink-0 cursor-pointer items-center">
                <input type="checkbox" checked={allInStock} onChange={(e) => toggleAllAvailability(e.target.checked)} className="peer sr-only" />
                <span className="absolute inset-0 rounded-full bg-neutral-300 transition peer-checked:bg-emerald-500" />
                <span className="absolute left-[3px] h-4 w-4 rounded-full bg-white transition peer-checked:left-[21px]" />
              </label>
            </div>
          </div>

          <div className="mt-2.5 space-y-2.5">
            {products.map((p) => (
              <div key={p.id} className="rounded-2xl border border-border bg-white p-3.5">
                {editingId === p.id ? (
                  <div className="space-y-2">
                    <Input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Product name" />
                    <Input value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} placeholder="Description" />
                    <Input type="number" value={draft.price} onChange={(e) => setDraft((d) => ({ ...d, price: Number(e.target.value) }))} placeholder="Price" />
                    <label className="flex items-center gap-2 text-xs">
                      <input type="checkbox" checked={draft.featured} onChange={(e) => setDraft((d) => ({ ...d, featured: e.target.checked }))} />
                      Featured on home page
                    </label>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEdit(p.id)}>Save changes</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2.5">
                      <span className="text-sm leading-relaxed">{p.isAvailable ? "🟢" : "🔺"}</span>
                      <div className="flex h-[60px] w-[60px] flex-shrink-0 items-center justify-center rounded-xl bg-blush text-2xl">{p.icon}</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-ink">{p.name}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted">{p.description}</p>
                        <p className="mt-1 text-sm font-bold text-rose">{formatINR(p.price)}</p>
                      </div>
                      <label className="relative inline-flex h-[22px] w-10 flex-shrink-0 cursor-pointer items-center">
                        <input type="checkbox" checked={p.isAvailable} onChange={(e) => toggleAvailability(p.id, e.target.checked)} className="peer sr-only" />
                        <span className="absolute inset-0 rounded-full bg-neutral-300 transition peer-checked:bg-emerald-500" />
                        <span className="absolute left-[3px] h-4 w-4 rounded-full bg-white transition peer-checked:left-[21px]" />
                      </label>
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted">{p.isAvailable ? "In stock" : "Marked out of stock"}</p>
                    <div className="mt-2 flex justify-end border-t border-border pt-2">
                      <button onClick={() => startEdit(p)} className="text-xs font-bold text-rose">✏️ Edit</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
