"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CustomerHeader } from "@/components/CustomerHeader";
import { CustomerBottomNav } from "@/components/CustomerBottomNav";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils";

const OCCASION_ICONS: Record<string, string> = { Birthday: "🎂", Anniversary: "💕", Wedding: "💍", Festival: "🎁", Other: "🔔" };

interface Contributor { name: string; amount: number; paid: boolean }
interface GroupGift {
  id: string; title: string; recipientName: string; occasionType: string; goalAmount: number;
  deliveryDate: string; contributors: Contributor[];
}

function initials(name: string) {
  return name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}
function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function GroupGiftCard({ g }: { g: GroupGift }) {
  const collected = g.contributors.filter((c) => c.paid).reduce((s, c) => s + c.amount, 0);
  const pct = Math.min(100, Math.round((collected / g.goalAmount) * 100));
  const ready = collected >= g.goalAmount;
  const paidCount = g.contributors.filter((c) => c.paid).length;
  const days = daysUntil(g.deliveryDate);
  const avatarsToShow = g.contributors.slice(0, 4);
  const overflow = g.contributors.length - avatarsToShow.length;

  return (
    <Link href={`/group-gifts/${g.id}`} className="block rounded-2xl border border-border bg-white p-3.5 shadow-sm">
      <div className="flex items-center gap-2.5">
        <span className="text-xl">{OCCASION_ICONS[g.occasionType] ?? "🎁"}</span>
        <p className="flex-1 text-sm font-bold text-ink">{g.title}</p>
        <span className="text-base text-muted">›</span>
      </div>
      <p className="mt-2 text-[13px] font-bold">
        {formatINR(collected)} of {formatINR(g.goalAmount)} collected <span className="text-rose">{pct}%</span>
      </p>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full bg-rose" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex">
          {avatarsToShow.map((c, i) => (
            <div
              key={i}
              style={{ marginLeft: i > 0 ? -8 : 0 }}
              className="flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 border-background bg-blush text-[10px] font-bold text-rose"
            >
              {initials(c.name)}
            </div>
          ))}
          {overflow > 0 && (
            <div style={{ marginLeft: -8 }} className="flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 border-background bg-ink text-[10px] font-bold text-white">
              +{overflow}
            </div>
          )}
        </div>
        {ready ? (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">✓ Ready to order</span>
        ) : (
          <span className="rounded-full bg-blush px-2.5 py-1 text-[11px] font-semibold text-ink">🕐 {days > 0 ? `${days}d left` : "Due today"}</span>
        )}
      </div>
      <p className="mt-1.5 text-[11px] text-muted">{paidCount} of {g.contributors.length} contributed</p>
    </Link>
  );
}

export default function GroupGiftsPage() {
  const router = useRouter();
  const [gifts, setGifts] = useState<GroupGift[]>([]);
  const [tab, setTab] = useState<"active" | "upcoming">("active");

  useEffect(() => {
    fetch("/api/group-gifts").then((r) => r.json()).then((d) => setGifts(d.groupGifts ?? []));
  }, []);

  function collectedOf(g: GroupGift) {
    return g.contributors.filter((c) => c.paid).reduce((s, c) => s + c.amount, 0);
  }
  const active = gifts.filter((g) => collectedOf(g) > 0);
  const upcoming = gifts.filter((g) => collectedOf(g) === 0);
  const list = tab === "active" ? active : upcoming;

  return (
    <div className="pb-20 sm:pb-10">
      <CustomerHeader />
      <main className="mx-auto max-w-2xl px-4 py-4">
        <div className="mb-3.5 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-lg font-bold text-ink">Group Gifting</h1>
            <p className="mt-0.5 text-xs text-muted">Invite friends, split contributions, and send one thoughtful gift together.</p>
          </div>
          <button
            onClick={() => router.push("/group-gifts/new")}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-rose text-lg text-white"
            aria-label="Create group gift"
          >
            +
          </button>
        </div>

        <div className="mb-3.5 flex gap-1 rounded-full bg-blush p-1">
          <button
            onClick={() => setTab("active")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-semibold ${tab === "active" ? "bg-ink text-white" : "text-ink"}`}
          >
            Active Groups
            <span className={`rounded-full px-1.5 text-[10px] font-bold ${tab === "active" ? "bg-white/30 text-white" : "bg-border text-ink"}`}>
              {active.length}
            </span>
          </button>
          <button
            onClick={() => setTab("upcoming")}
            className={`flex-1 rounded-full py-1.5 text-xs font-semibold ${tab === "upcoming" ? "bg-ink text-white" : "text-ink"}`}
          >
            Upcoming
          </button>
        </div>

        {list.length === 0 ? (
          <div className="rounded-2xl border border-border bg-white p-8 text-center">
            <p className="text-3xl">🎉</p>
            <p className="mt-2.5 font-serif text-base font-semibold text-ink">No {tab} groups</p>
            <p className="mt-1 text-sm text-muted">Start a group gift for someone&apos;s next birthday or occasion.</p>
            <Link href="/group-gifts/new"><Button className="mt-3.5">+ Create group gift</Button></Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {list.map((g) => <GroupGiftCard key={g.id} g={g} />)}
          </div>
        )}
      </main>
      <CustomerBottomNav />
    </div>
  );
}
