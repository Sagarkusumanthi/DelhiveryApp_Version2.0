"use client";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Store { name: string; description: string | null; address: string | null; openTime: string; closeTime: string; open: boolean }

export default function StoreProfilePage() {
  const [store, setStore] = useState<Store | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/store/profile").then((r) => r.json()).then((d) => setStore(d.store));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!store) return;
    await fetch("/api/store/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(store),
    });
    setSaved(`Updated at ${new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}`);
    setTimeout(() => setSaved(null), 2500);
  }

  if (!store) return <p className="py-10 text-center text-sm text-muted">Loading…</p>;

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-4 font-serif text-xl font-semibold text-ink">Store profile</h1>
      <form onSubmit={save} className="space-y-3 rounded-3xl border border-border bg-white p-4">
        <div>
          <Label>Store name</Label>
          <Input value={store.name} onChange={(e) => setStore({ ...store, name: e.target.value })} />
        </div>
        <div>
          <Label>Description</Label>
          <Input value={store.description ?? ""} onChange={(e) => setStore({ ...store, description: e.target.value })} />
        </div>
        <div>
          <Label>Address</Label>
          <Input value={store.address ?? ""} onChange={(e) => setStore({ ...store, address: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Opens at</Label>
            <Input type="time" value={store.openTime} onChange={(e) => setStore({ ...store, openTime: e.target.value })} />
          </div>
          <div>
            <Label>Closes at</Label>
            <Input type="time" value={store.closeTime} onChange={(e) => setStore({ ...store, closeTime: e.target.value })} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink/80">
          <input type="checkbox" checked={store.open} onChange={(e) => setStore({ ...store, open: e.target.checked })} />
          Store is open
        </label>
        <Button type="submit" className="w-full">Save changes</Button>
        {saved && <p className="text-center text-xs font-semibold text-emerald-700">{saved}</p>}
      </form>
    </div>
  );
}
