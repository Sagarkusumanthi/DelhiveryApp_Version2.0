export function Sparkline({ buckets, color }: { buckets: number[]; color: string }) {
  const max = Math.max(1, ...buckets);
  const w = 160;
  const h = 40;
  const step = w / (buckets.length - 1 || 1);
  const points = buckets.map((v, i) => `${Math.round(i * step)},${Math.round(h - (v / max) * h)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 40, display: "block" }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
