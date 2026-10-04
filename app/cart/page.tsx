"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CustomerHeader } from "@/components/CustomerHeader";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/hooks/useCart";
import { formatINR } from "@/lib/utils";

interface Product { id: string; name: string; price: number; icon: string }

export default function CartPage() {
  const router = useRouter();
  const { cart, itemsArray, addItem } = useCart();
  const [products, setProducts] = useState<Record<string, Product>>({});

  useEffect(() => {
    Promise.all(itemsArray.map((i) => fetch(`/api/products/${i.productId}`).then((r) => r.json()))).then((results) => {
      const map: Record<string, Product> = {};
      for (const r of results) if (r.product) map[r.product.id] = r.product;
      setProducts(map);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(cart.items)]);

  const subtotal = itemsArray.reduce((sum, i) => sum + (products[i.productId]?.price ?? 0) * i.qty, 0);

  return (
    <div className="pb-10">
      <CustomerHeader />
      <main className="mx-auto max-w-2xl px-4 py-4">
        <h1 className="mb-4 font-serif text-xl font-semibold text-ink">Your cart</h1>
        {itemsArray.length === 0 ? (
          <div className="rounded-3xl border border-border bg-white p-8 text-center">
            <p className="text-sm text-muted">Your cart is empty.</p>
            <Link href="/" className="mt-3 inline-block text-sm font-semibold text-rose">Browse gifts →</Link>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {itemsArray.map((i) => {
                const p = products[i.productId];
                if (!p) return null;
                return (
                  <div key={i.productId} className="flex items-center gap-3 rounded-2xl border border-border bg-white p-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blush text-2xl">{p.icon}</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{p.name}</p>
                      <p className="text-sm text-muted">{formatINR(p.price)}</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-border px-2 py-1">
                      <button
                        onClick={() => cart.storeId && addItem(cart.storeId, i.productId, -1)}
                        className="h-6 w-6 rounded-full bg-blush text-sm font-bold"
                      >
                        −
                      </button>
                      <span className="w-4 text-center text-sm font-semibold">{i.qty}</span>
                      <button
                        onClick={() => cart.storeId && addItem(cart.storeId, i.productId, 1)}
                        className="h-6 w-6 rounded-full bg-blush text-sm font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 rounded-2xl border border-border bg-white p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Subtotal</span>
                <span className="font-semibold">{formatINR(subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-muted">Delivery fee calculated at checkout.</p>
            </div>
            <Button className="mt-4 w-full" onClick={() => router.push("/checkout")}>
              Proceed to checkout →
            </Button>
          </>
        )}
      </main>
    </div>
  );
}
