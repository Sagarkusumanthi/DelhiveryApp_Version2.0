"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CustomerHeader } from "@/components/CustomerHeader";
import { CustomerBottomNav } from "@/components/CustomerBottomNav";
import { ProductCard } from "@/components/ProductCard";
import { StoreCard } from "@/components/StoreCard";
import { FeaturedCircle } from "@/components/FeaturedCircle";
import { formatINR } from "@/lib/utils";
import { STATUS_LABELS } from "@/lib/demo";

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
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const featuredRef = useRef<HTMLDivElement>(null);

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
      fetch(`/api/products?${params}`).then((r) => r.json()),
    ]).then(([s, p, all]) => {
      setStores(s.stores);
      setFeatured(p.products);
      setAllProducts(all.products);
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

  const q = query.trim().toLowerCase();
  const matchingStores = q ? stores.filter((s) => s.name.toLowerCase().includes(q)) : [];
  const matchingProducts = q ? allProducts.filter((p) => p.name.toLowerCase().includes(q)) : [];
  const cityName = cities.find((c) => c.id === cityId)?.name ?? "";

  return (
    <div className="pb-20 sm:pb-10">
      <CustomerHeader />
      <main className="mx-auto max-w-2xl px-4 py-4">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-blush px-3 py-1.5 text-xs font-semibold text-ink">
          📍 <span className="text-[10px] uppercase text-muted">Delivering to</span>
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

        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search gifts or stores…"
            className="w-full rounded-full border border-border bg-white px-4 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-rose"
          />
          <button className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-rose text-white">🔍</button>
        </div>

        {q ? (
          <div className="mt-4">
            {matchingStores.length > 0 && (
              <>
                <p className="mb-2 mt-3 text-xs font-semibold uppercase tracking-wide text-muted">Stores</p>
                <div className="space-y-2">
                  {matchingStores.map((s) => <StoreCard key={s.id} store={s} />)}
                </div>
              </>
            )}
            <p className="mb-2 mt-3 text-xs font-semibold uppercase tracking-wide text-muted">Gifts</p>
            {matchingProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {matchingProducts.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted">No results found. Try a different search.</p>
            )}
          </div>
        ) : (
          <>
            <div ref={featuredRef} className="mb-5 mt-4 rounded-3xl bg-ink p-5 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70">Same-day in {cityName}</p>
              <p className="mt-1 font-serif text-2xl font-semibold">Make someone&apos;s day special.</p>
              <p className="mt-1 text-sm text-white/80">Thoughtful gifts from local stores.</p>
              <button
                onClick={() => featuredRef.current?.scrollIntoView({ behavior: "smooth" })}
                className="mt-3 rounded-full bg-rose px-4 py-2 text-sm font-semibold text-white"
              >
                Explore gifts ↓
              </button>
            </div>

            {activeOrder ? (
              <Link
                href={`/orders/${activeOrder.id}/track`}
                className="mb-5 block rounded-3xl border border-rose/30 bg-white p-4 shadow-sm"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-serif text-sm font-semibold text-ink">📦 Track your gift</p>
                  <span className="rounded-full bg-blush px-2.5 py-1 text-[11px] font-semibold text-ink">
                    {STATUS_LABELS[activeOrder.status] ?? activeOrder.status}
                  </span>
                </div>
                <p className="text-sm font-semibold text-ink">{activeOrder.items[0]?.product?.name}</p>
                <p className="text-xs text-muted">For {activeOrder.recipientName} · {activeOrder.code}</p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-sm text-muted">Total {formatINR(activeOrder.total)}</p>
                  <span className="text-sm font-semibold text-ink">Track order →</span>
                </div>
              </Link>
            ) : (
              <div className="mb-5 rounded-3xl border-2 border-dashed border-border p-4">
                <p className="font-serif text-sm font-semibold text-ink">No gifts on the way</p>
                <p className="mt-1 text-xs text-muted">Once you send a gift, you can track it right here.</p>
              </div>
            )}

            <div className="mb-4 flex gap-2 overflow-x-auto rounded-full bg-blush p-1 no-scrollbar">
              <button
                onClick={() => setCategory(null)}
                className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold ${!category ? "bg-ink text-white" : "text-muted"}`}
              >
                ✨ All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.name)}
                  className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold ${category === c.name ? "bg-ink text-white" : "text-muted"}`}
                >
                  {c.icon} {c.name}
                </button>
              ))}
            </div>

            {loading ? (
              <p className="py-10 text-center text-sm text-muted">Loading…</p>
            ) : (
              <>
                <p className="mb-0.5 font-serif text-base font-semibold text-ink">Featured gifts in {cityName}</p>
                <p className="mb-2 text-xs text-muted">{featured.length} {featured.length === 1 ? "gift" : "gifts"} available today</p>
                {featured.length > 0 ? (
                  <div className="no-scrollbar mb-6 flex gap-3.5 overflow-x-auto pb-1">
                    {featured.map((p) => <FeaturedCircle key={p.id} product={p} />)}
                  </div>
                ) : (
                  <p className="mb-6 py-4 text-center text-sm text-muted">No gifts found. Try a different category.</p>
                )}

                <p className="mb-2 font-serif text-base font-semibold text-ink">
                  Popular local stores <span className="text-xs font-normal text-muted">({stores.length})</span>
                </p>
                <div className="space-y-2">
                  {stores.map((s) => <StoreCard key={s.id} store={s} />)}
                  {stores.length === 0 && <p className="py-6 text-center text-sm text-muted">We are not in this city yet. Try another city!</p>}
                </div>

                <p className="mb-2 mt-5 font-serif text-base font-semibold text-ink">Coming soon</p>
                <div className="flex items-center gap-2 rounded-2xl border border-dashed border-border px-3 py-2.5 text-xs">
                  ✨ AI Gift Assistant
                  <span className="ml-auto rounded-full bg-blush px-2 py-0.5 text-[10px] font-semibold text-ink">Soon</span>
                </div>
              </>
            )}
          </>
        )}
      </main>
      <CustomerBottomNav />
    </div>
  );
}
