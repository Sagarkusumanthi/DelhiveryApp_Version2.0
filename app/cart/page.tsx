"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CustomerHeader } from "@/components/CustomerHeader";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/hooks/useCart";
import { formatINR } from "@/lib/utils";

interface Product { id: string; name: string; price: number; icon: string }
interface Store { id: string; name: string }

export default function CartPage() {
  const router = useRouter();
  const { cart, itemsArray, addItem } = useCart();
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [store, setStore] = useState<Store | null>(null);

  useEffect(() => {
    Promise.all(itemsArray.map((i) => fetch(`/api/products/${i.productId}`).then((r) => r.json()))).then((results) => {
      const map: Record<string, Product> = {};
      for (const r of results) if (r.product) map[r.product.id] = r.product;
      setProducts(map);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(cart.items)]);

  useEffect(() => {
    if (cart.storeId) fetch(`/api/stores/${cart.storeId}`).then((r) => r.json()).then((d) => setStore(d.store));
  }, [cart.storeId]);

  const subtotal = itemsArray.reduce((sum, i) => sum + (products[i.productId]?.price ?? 0) * i.qty, 0);

  return (
    <div className="pb-10">
      <CustomerHeader />
      <main className="mx-auto max-w-2xl px-4 py-4">
        <h1 className="mb-4 font-serif text-xl font-semibold text-ink">Your cart</h1>
        {itemsArray.length === 0 ? (
          <div className="rounded-3xl border border-border bg-white p-8 text-center">
            <p className="text-3xl">🛒</p>
            <p className="mt-2 font-serif text-base font-semibold text-ink">Your cart is empty</p>
            <p className="mt-1 text-sm text-muted">Add a gift from any store to get started.</p>
            <Link href="/">
              <Button className="mt-3">Browse gifts</Button>
            </Link>
          </div>
        ) : (
          <>
            {store && <p className="-mt-2 mb-3 text-sm text-muted">From {store.name}</p>}
            <div className="rounded-2xl border border-border bg-white p-4">
              {itemsArray.map((i) => {
                const p = products[i.productId];
                if (!p) return null;
                return (
                  <div key={i.productId} className="flex items-center gap-3 border-b border-border py-2 last:border-0">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blush text-2xl">{p.icon}</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{p.name}</p>
                      <p className="text-xs text-muted">{formatINR(p.price)} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => cart.storeId && addItem(cart.storeId, i.productId, -1)}
                        className="h-6 w-6 rounded-full border border-border text-sm font-bold"
                      >
                        −
                      </button>
                      <span className="w-4 text-center text-sm font-semibold">{i.qty}</span>
                      <button
                        onClick={() => cart.storeId && addItem(cart.storeId, i.productId, 1)}
                        className="h-6 w-6 rounded-full border border-border text-sm font-bold"
                      >
                        +
                      </button>
                    </div>
                    <p className="w-16 text-right text-sm font-semibold text-rose">{formatINR(p.price * i.qty)}</p>
                  </div>
                );
              })}
              <div className="flex justify-between pt-2.5 text-sm font-semibold">
                <span>Subtotal</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              <p className="mt-0.5 text-[11px] text-muted">Delivery fee is calculated at checkout.</p>
            </div>
            {store && (
              <Button variant="outline" className="mt-3 w-full" onClick={() => router.push(`/stores/${store.id}`)}>
                + Add more from {store.name}
              </Button>
            )}
            <Button className="mt-2 w-full" onClick={() => router.push("/checkout")}>
              Proceed to checkout →
            </Button>
          </>
        )}
      </main>
    </div>
  );
}
