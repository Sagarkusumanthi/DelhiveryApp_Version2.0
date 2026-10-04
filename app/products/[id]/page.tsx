"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CustomerHeader } from "@/components/CustomerHeader";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/hooks/useCart";
import { formatINR } from "@/lib/utils";

interface Product {
  id: string; name: string; price: number; icon: string; description: string | null;
  isAvailable: boolean; storeId: string; store: { name: string };
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { cart, addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

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

  function handleAddToCart() {
    if (!product) return;
    if (cart.storeId && cart.storeId !== product.storeId) {
      const ok = window.confirm(
        "Your cart already has gifts from another store. Clear the cart and add this item instead?"
      );
      if (!ok) return;
    }
    addItem(product.storeId, product.id, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="pb-10">
      <CustomerHeader />
      <main className="mx-auto max-w-2xl px-4 py-4">
        <button onClick={() => router.back()} className="mb-3 text-sm font-medium text-muted">← Back</button>
        <div className="mb-4 flex h-48 items-center justify-center rounded-3xl bg-blush text-7xl">{product.icon}</div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{product.store.name}</p>
        <h1 className="font-serif text-2xl font-semibold text-ink">{product.name}</h1>
        <p className="mt-1 text-xl font-bold text-rose">{formatINR(product.price)}</p>
        {product.description && <p className="mt-3 text-sm text-ink/80">{product.description}</p>}
        {!product.isAvailable && (
          <p className="mt-3 text-sm font-semibold text-red-600">This item is currently out of stock.</p>
        )}

        <div className="mt-6 flex items-center gap-3">
          <div className="flex items-center gap-3 rounded-full border border-border px-3 py-2">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-6 w-6 rounded-full bg-blush text-sm font-bold">−</button>
            <span className="w-4 text-center text-sm font-semibold">{qty}</span>
            <button onClick={() => setQty((q) => Math.min(10, q + 1))} className="h-6 w-6 rounded-full bg-blush text-sm font-bold">+</button>
          </div>
          <Button className="flex-1" disabled={!product.isAvailable} onClick={handleAddToCart}>
            {added ? "Added ✓" : "Add to cart"}
          </Button>
        </div>
      </main>
    </div>
  );
}
