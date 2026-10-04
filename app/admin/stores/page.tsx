"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface Store { id: string; name: string; category: string; icon: string; open: boolean }

export default function AdminStoresPage() {
  const [stores, setStores] = useState<Store[]>([]);

  function load() {
    fetch("/api/stores").then((r) => r.json()).then((d) => setStores(d.stores ?? []));
  }
  useEffect(load, []);

  async function toggle(id: string, open: boolean) {
    setStores((prev) => prev.map((s) => (s.id === id ? { ...s, open } : s)));
    await fetch(`/api/admin/stores/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ open }),
    });
  }

  return (
    <div>
      <h1 className="mb-4 font-serif text-xl font-semibold text-ink">Stores</h1>
      <div className="space-y-2">
        {stores.map((s) => (
          <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blush text-xl">{s.icon}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{s.name}</p>
              <p className="text-xs text-muted">{s.category}</p>
            </div>
            <Button
              size="sm"
              variant={s.open ? "destructive" : "primary"}
              onClick={() => toggle(s.id, !s.open)}
            >
              {s.open ? "Ban" : "Unban"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
