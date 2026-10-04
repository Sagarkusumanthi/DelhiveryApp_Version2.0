"use client";
import Link from "next/link";
import { demoRating, demoDelivery } from "@/lib/demo";

export function StoreCard({ store }: { store: { id: string; name: string; category: string; icon: string; open: boolean } }) {
  return (
    <Link
      href={`/stores/${store.id}`}
      className="flex items-center gap-3 rounded-2xl border border-border bg-white p-2.5 shadow-sm"
    >
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-border bg-blush text-xl">
        {store.icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{store.name}</p>
        <p className="text-xs text-muted">{store.category}</p>
        <p className="flex items-center gap-1 text-[10px] text-muted">
          ⭐ {demoRating(store.id).toFixed(1)} · 🕐 {demoDelivery(store.id)}
        </p>
      </div>
      <span
        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
          store.open ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-500"
        }`}
      >
        {store.open ? "Open" : "Closed"}
      </span>
    </Link>
  );
}
