"use client";
import Link from "next/link";

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
      </div>
      {!store.open && (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">Closed</span>
      )}
    </Link>
  );
}
