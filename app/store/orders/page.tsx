"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { formatINR } from "@/lib/utils";

interface HistoryEntry { status: string; at: string }
interface Order {
  id: string; code: string; status: string; total: number; recipientName: string; recipientAddress: string;
  deliveryOption: "STANDARD" | "EXPRESS" | "SCHEDULED"; message: string | null; createdAt: string;
  history: HistoryEntry[]; items: { product: { name: string }; qty: number }[];
}
interface Store { open: boolean }

const TABS: [string, string, string[]][] = [
  ["new", "New", ["ORDER_PLACED"]],
  ["progress", "Preparing", ["STORE_ACCEPTED", "PREPARING_GIFT"]],
  ["ready", "Ready", ["READY_FOR_PICKUP", "OUT_FOR_DELIVERY"]],
  ["done", "Completed", ["DELIVERED"]],
  ["rejected", "Rejected", ["REJECTED"]],
];
const DELIVERY_LABEL: Record<string, string> = { STANDARD: "Standard delivery", EXPRESS: "Same-day express", SCHEDULED: "Scheduled delivery" };

function elapsedLabel(sinceIso: string, tick: number) {
  void tick;
  const sec = Math.max(0, Math.floor((Date.now() - new Date(sinceIso).getTime()) / 1000));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

export default function StoreOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [tab, setTab] = useState("new");
  const [tick, setTick] = useState(0);

  function load() {
    fetch("/api/store/orders").then((r) => r.json()).then((d) => setOrders(d.orders ?? []));
    fetch("/api/store/profile").then((r) => r.json()).then((d) => setStore(d.store));
  }
  useEffect(load, []);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  async function act(id: string, status: string, reason?: string) {
    await fetch(`/api/store/orders/${id}/transition`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reason }),
    });
    load();
  }

  async function reject(id: string) {
    const reason = window.prompt("Reason for rejecting this order (min 3 characters):");
    if (!reason || reason.trim().length < 3) return;
    await act(id, "REJECTED", reason);
  }

  async function toggleOnline() {
    if (!store) return;
    const open = !store.open;
    setStore({ open });
    await fetch("/api/store/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ open }),
    });
  }

  const activeTab = TABS.find((t) => t[0] === tab) ?? TABS[0];
  const list = orders.filter((o) => activeTab[2].includes(o.status));

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="font-serif text-lg font-bold text-ink">Orders</p>
        {store && (
          <button
            onClick={toggleOnline}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${store.open ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${store.open ? "bg-emerald-500" : "bg-red-600"}`} />
            {store.open ? "Online" : "Offline"}
          </button>
        )}
      </div>

      <div className="no-scrollbar mt-2.5 flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map(([key, label, statuses]) => {
          const count = orders.filter((o) => statuses.includes(o.status)).length;
          const active = key === tab;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${active ? "bg-ink text-white" : "bg-blush text-ink"}`}
            >
              {label}
              <span className={`rounded-full px-1.5 text-[10px] font-bold ${active ? "bg-white/30" : "bg-border"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 space-y-3">
        {list.map((o) => {
          const totalQty = o.items.reduce((s, it) => s + it.qty, 0);
          const isLarge = totalQty >= 3;
          const inProgress = ["STORE_ACCEPTED", "PREPARING_GIFT", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"].includes(o.status);
          const acceptedAt = inProgress ? o.history.find((h) => h.status === "STORE_ACCEPTED")?.at : null;
          const addressTail = o.recipientAddress.split(",").slice(-1)[0]?.trim();

          return (
            <div
              key={o.id}
              onClick={() => router.push(`/store/orders/${o.id}`)}
              className="cursor-pointer rounded-2xl border border-border bg-white p-3.5"
            >
              {isLarge && (
                <span className="mb-2 inline-block rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-white">
                  🛍️ Large order
                </span>
              )}
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-ink">{o.code} <span className="text-xs font-normal text-muted">📋</span></p>
                <div className="flex items-center gap-1.5">
                  {acceptedAt && (
                    <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold tabular-nums text-amber-800">
                      ⏱ {elapsedLabel(acceptedAt, tick)}
                    </span>
                  )}
                  <StatusBadge status={o.status} />
                </div>
              </div>
              <p className="mt-1 text-xs text-muted">{o.recipientName} · {addressTail}</p>
              <p className="text-[11px] text-muted">Placed {new Date(o.history[0]?.at ?? o.createdAt).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>

              <div className="mt-2 border-t border-border pt-2">
                <p className="mb-1 text-[11px] font-bold uppercase text-muted">🧺 Order details · {totalQty} item{totalQty > 1 ? "s" : ""}</p>
                {o.items.map((it, i) => <p key={i} className="text-xs">{it.qty} × {it.product.name}</p>)}
              </div>

              <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-blush px-2.5 py-1.5 text-[11px]">
                🚚 {DELIVERY_LABEL[o.deliveryOption]}{o.message ? " · 💌 Gift message included" : ""}
              </div>

              {o.status === "ORDER_PLACED" && (
                <div className="mt-2.5 flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => reject(o.id)} className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-semibold text-white">✕ Reject</button>
                  <button onClick={() => act(o.id, "STORE_ACCEPTED")} className="flex-1 rounded-xl bg-rose py-2 text-sm font-semibold text-white">✓ Accept</button>
                </div>
              )}

              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-muted">Total bill</span>
                <span className="text-sm font-bold">{formatINR(o.total)}</span>
              </div>
            </div>
          );
        })}
        {list.length === 0 && <p className="rounded-2xl border border-border bg-white p-4 text-sm text-muted">Nothing in this tab right now.</p>}
      </div>
    </div>
  );
}
