"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CustomerHeader } from "@/components/CustomerHeader";
import { CustomerBottomNav } from "@/components/CustomerBottomNav";
import { ProductCard } from "@/components/ProductCard";
import { StoreCard } from "@/components/StoreCard";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils";

interface City { id: string; name: string }
interface Category { id: string; name: string; icon: string }
interface Store { id: string; name: string; category: string; icon: string; open: boolean; cityId: string }
interface Product { id: string; name: string; price: number; icon: string; isAvailable: boolean; featured: boolean; storeId: string }
interface Order { id: string; code: string; status: string; total: number; recipientName: string; items: { product: Product }[] }

export default function HomePage() {
  const [cities, setCities] = useState<City[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cityId, setCityId] = useState("hyd");
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [stores, setStores] = useState<Store[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/cities").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]).then(([c, cat]) => {
      setCities(c.cities);
      setCategories(cat.categories);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ cityId });
    if (category) params.set("category", category);
    Promise.all([
      fetch(`/api/stores?${params}`).then((r) => r.json()),
      fetch(`/api/products?${params}&featured=true`).then((r) => r.json()),
    ]).then(([s, p]) => {
      setStores(s.stores);
      setFeatured(p.products);
      setLoading(false);
    });
  }, [cityId, category]);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => {
        const active = (d.orders ?? []).find((o: Order) => !["DELIVERED", "REJECTED"].includes(o.status));
        setActiveOrder(active ?? null);
      });
  }, []);

  const filteredStores = useMemo(() => {
    if (!query.trim()) return stores;
    const q = query.toLowerCase();
    return stores.filter((s) => s.name.toLowerCase().includes(q));
  }, [stores, query]);

  return (
    <div className="pb-20 sm:pb-10">
      <CustomerHeader />
      <main className="mx-auto max-w-2xl px-4 py-4">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-blush px-3 py-1.5 text-xs font-semibold text-ink">
          📍 DELIVERING TO
          <select
            value={cityId}
            onChange={(e) => setCityId(e.target.value)}
            className="bg-transparent font-bold text-ink outline-none"
          >
            {cities.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search gifts or stores…"
          className="mb-4 w-full rounded-full border border-border bg-white px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-rose"
        />

        <div className="mb-5 rounded-3xl bg-ink p-5 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70">Same-day in {cities.find((c) => c.id === cityId)?.name}</p>
          <p className="mt-1 font-serif text-2xl font-semibold">Make someone&apos;s day special.</p>
          <p className="mt-1 text-sm text-white/80">Thoughtful gifts from local stores.</p>
        </div>

        {activeOrder && (
          <Link
            href={`/orders/${activeOrder.id}/track`}
            className="mb-5 block rounded-3xl border border-rose/30 bg-white p-4 shadow-sm"
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="font-serif text-sm font-semibold text-ink">📦 Track your gift</p>
              <span className="rounded-full bg-blush px-2.5 py-1 text-[11px] font-semibold text-ink">
                {activeOrder.status.replaceAll("_", " ")}
              </span>
            </div>
            <p className="text-sm font-semibold text-ink">{activeOrder.items[0]?.product?.name}</p>
            <p className="text-xs text-muted">For {activeOrder.recipientName} · {activeOrder.code}</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-sm text-muted">Total {formatINR(activeOrder.total)}</p>
              <span className="text-sm font-semibold text-ink">Track order →</span>
            </div>
          </Link>
        )}

        <div className="mb-4 flex gap-2 overflow-x-auto rounded-full bg-blush p-1 no-scrollbar">
          <button
            onClick={() => setCategory(null)}
            className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold ${
              !category ? "bg-ink text-white" : "text-muted"
            }`}
          >
            ✨ All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.name)}
              className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold ${
                category === c.name ? "bg-ink text-white" : "text-muted"
              }`}
            >
              {c.icon} {c.name}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-muted">Loading…</p>
        ) : (
          <>
            {featured.length > 0 && (
              <section className="mb-6">
                <p className="mb-2 font-serif text-base font-semibold text-ink">Featured gifts</p>
                <div className="grid grid-cols-3 gap-2">
                  {featured.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </section>
            )}
            <section>
              <p className="mb-2 font-serif text-base font-semibold text-ink">Stores near you</p>
              <div className="space-y-2">
                {filteredStores.map((s) => (
                  <StoreCard key={s.id} store={s} />
                ))}
                {filteredStores.length === 0 && (
                  <p className="py-6 text-center text-sm text-muted">No stores match your search.</p>
                )}
              </div>
            </section>
          </>
        )}
      </main>
      <CustomerBottomNav />
    </div>
  );
}
