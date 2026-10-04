"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CustomerHeader } from "@/components/CustomerHeader";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/hooks/useCart";
import { DELIVERY_FEES } from "@/lib/constants";
import { formatINR } from "@/lib/utils";

interface Product {
  id: string; name: string; price: number; icon: string; description: string | null;
  isAvailable: boolean; storeId: string;
  store: { id: string; name: string; open: boolean; cityId: string };
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { cart, addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((d) => setProduct(d.product));
  }, [id]);

  if (!product) {
    return (
      <div>
        <CustomerHeader />
        <p className="py-10 text-center text-sm text-muted">Loading…</p>
      </div>
    );
  }

  const disabled = !product.isAvailable || !product.store.open;

  function sendGift() {
    if (!product) return;
    if (cart.storeId && cart.storeId !== product.storeId) {
      const ok = window.confirm(
        "Your cart already has gifts from another store. Clear the cart and add this item instead?"
      );
      if (!ok) return;
    }
    addItem(product.storeId, product.id, 1);
    router.push(`/stores/${product.storeId}`);
  }

  return (
    <div className="pb-10">
      <CustomerHeader />
      <main className="mx-auto max-w-2xl px-4 py-4">
        <button onClick={() => router.back()} className="mb-3 text-sm font-medium text-muted">← Back</button>
        <div className="mb-3 flex h-44 items-center justify-center rounded-2xl bg-blush text-7xl">{product.icon}</div>
        <p className="mt-2 inline-block rounded-full bg-blush px-2.5 py-1 text-xs font-semibold text-ink">
          📍 delivers from {product.store.name}
        </p>
        <h1 className="mt-2 font-serif text-xl font-bold text-ink">{product.name}</h1>
        <p
          className="cursor-pointer text-sm text-rose"
          onClick={() => router.push(`/stores/${product.storeId}`)}
        >
          🏪 Fulfilled by {product.store.name}
        </p>
        <p className="mt-1 text-lg font-semibold text-ink">{formatINR(product.price)}</p>
        {product.description && <p className="mt-2 text-sm text-muted">{product.description}</p>}
        <div className="mt-3 rounded-xl border border-dashed border-border px-3 py-2 text-xs text-muted">
          Delivery estimates shown at checkout are approximate.
        </div>
        {disabled && (
          <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {!product.store.open ? "This store is closed right now." : "This item is currently out of stock."}
          </div>
        )}
        <Button className="mt-4 w-full" disabled={disabled} onClick={sendGift}>
          Send this gift · {formatINR(product.price + DELIVERY_FEES.STANDARD)}
        </Button>
      </main>
    </div>
  );
}
