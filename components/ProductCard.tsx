"use client";
import Link from "next/link";
import { formatINR } from "@/lib/utils";
import { demoRating, demoDelivery } from "@/lib/demo";

export function ProductCard({ product }: { product: { id: string; name: string; price: number; icon: string; isAvailable: boolean } }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="block overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
    >
      <div className="flex h-24 items-center justify-center bg-blush text-4xl">{product.icon}</div>
      <div className="p-2.5">
        <p className="truncate text-sm font-semibold text-ink">{product.name}</p>
        <p className="flex items-center gap-1 text-[10px] text-muted">
          ⭐ {demoRating(product.id).toFixed(1)} · 🕐 {demoDelivery(product.id)}
        </p>
        <p className="text-sm font-semibold text-rose">{formatINR(product.price)}</p>
        {!product.isAvailable && <p className="text-[11px] font-medium text-red-500">Out of stock</p>}
      </div>
    </Link>
  );
}
