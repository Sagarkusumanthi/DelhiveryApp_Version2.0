import { STATUS_BADGE_COLORS, STATUS_LABELS } from "@/lib/demo";

export function StatusBadge({ status }: { status: string }) {
  const [bg, fg] = STATUS_BADGE_COLORS[status] ?? ["#eee", "#555"];
  return (
    <span
      className="inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ backgroundColor: bg, color: fg }}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
