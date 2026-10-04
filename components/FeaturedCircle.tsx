"use client";
import Link from "next/link";

export function FeaturedCircle({ product }: { product: { id: string; name: string; icon: string } }) {
  return (
    <Link href={`/products/${product.id}`} className="w-[76px] flex-shrink-0 text-center">
      <div className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full border-2 border-border bg-blush text-2xl">
        {product.icon}
      </div>
      <p className="mt-1.5 truncate text-[11px] font-semibold leading-tight text-ink">{product.name}</p>
    </Link>
  );
}
