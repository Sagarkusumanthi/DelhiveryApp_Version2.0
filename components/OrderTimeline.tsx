"use client";
import { STATUS_LABELS } from "@/lib/demo";

const SEQUENCE = ["ORDER_PLACED", "STORE_ACCEPTED", "PREPARING_GIFT", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED"];

export function OrderTimeline({ status }: { status: string }) {
  if (status === "REJECTED") {
    return <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">This order was rejected by the store.</p>;
  }
  const currentIdx = SEQUENCE.indexOf(status);
  return (
    <div className="space-y-0">
      {SEQUENCE.map((s, i) => {
        const state = i < currentIdx ? "done" : i === currentIdx ? "current" : "upcoming";
        return (
          <div key={s} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                  state === "done" ? "bg-emerald-500 text-white" : state === "current" ? "bg-rose text-white" : "bg-border text-muted"
                }`}
              >
                {state === "done" ? "✓" : ""}
              </span>
              {i < SEQUENCE.length - 1 && (
                <span className={`h-6 w-0.5 ${state === "upcoming" ? "bg-border" : "bg-rose"}`} />
              )}
            </div>
            <p className={`pb-5 text-sm ${state === "upcoming" ? "text-muted" : "font-semibold text-ink"}`}>{STATUS_LABELS[s]}</p>
          </div>
        );
      })}
    </div>
  );
}
