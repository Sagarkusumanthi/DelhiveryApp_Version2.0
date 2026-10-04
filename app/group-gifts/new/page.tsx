"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CustomerHeader } from "@/components/CustomerHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatINR } from "@/lib/utils";

const OCCASION_ICONS: Record<string, string> = { Birthday: "🎂", Anniversary: "💕", Wedding: "💍", Festival: "🎁", Other: "🔔" };

interface City { id: string; name: string }
interface Product { id: string; name: string; price: number; icon: string; featured: boolean; storeId: string; store: { name: string } }

export default function NewGroupGiftPage() {
  const router = useRouter();
  const [cities, setCities] = useState<City[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  const [recipientName, setRecipientName] = useState("");
  const [occasionType, setOccasionType] = useState<string>("Birthday");
  const [deliveryCityId, setDeliveryCityId] = useState("hyd");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [goalTouched, setGoalTouched] = useState(false);
  const [splitType, setSplitType] = useState<"equal" | "custom">("equal");
  const [contributors, setContributors] = useState<string[]>([]);
  const [contributorInput, setContributorInput] = useState("");
  const [customAmounts, setCustomAmounts] = useState<Record<number, string>>({});
  const [message, setMessage] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/cities").then((r) => r.json()).then((d) => setCities(d.cities));
    fetch("/api/products?featured=true").then((r) => r.json()).then((d) => setAllProducts(d.products));
  }, []);

  const selectedProducts = selectedProductIds
    .map((id) => allProducts.find((p) => p.id === id))
    .filter((p): p is Product => !!p);
  const selectedTotal = selectedProducts.reduce((s, p) => s + p.price, 0);
  const goal = Number(goalAmount) || selectedTotal;
  const people = ["You", ...contributors];

  useEffect(() => {
    if (allProducts.length && selectedProductIds.length === 0) setSelectedProductIds([allProducts[0].id]);
  }, [allProducts, selectedProductIds.length]);

  useEffect(() => {
    if (!goalTouched) setGoalAmount(String(selectedTotal));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTotal]);

  function addContributor() {
    const name = contributorInput.trim();
    if (!name) return;
    setContributors((c) => [...c, name]);
    setContributorInput("");
  }

  function copyLink() {
    navigator.clipboard?.writeText("https://giftly.demo/group/new").catch(() => {});
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 1500);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!recipientName || recipientName.length < 2) { setError("Enter a recipient name."); return; }
    if (!deliveryDate) { setError("Pick a delivery date."); return; }
    if (!goal || goal <= 0) { setError("Enter a goal amount greater than 0."); return; }

    let contributorPayload: { name: string; amount: number; paid: boolean }[];
    if (splitType === "equal") {
      const per = people.length ? Math.round(goal / people.length) : 0;
      contributorPayload = people.map((n, i) => ({ name: n, amount: per, paid: i === 0 }));
    } else {
      const total = people.reduce((s, _n, i) => s + (Number(customAmounts[i]) || 0), 0);
      if (total !== goal) { setError(`Custom amounts (${formatINR(total)}) must add up to the goal (${formatINR(goal)}).`); return; }
      contributorPayload = people.map((n, i) => ({ name: n, amount: Number(customAmounts[i]) || 0, paid: i === 0 }));
    }

    setLoading(true);
    try {
      const res = await fetch("/api/group-gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${recipientName}'s ${occasionType}`,
          occasionType,
          recipientName,
          deliveryCityId,
          deliveryDate: new Date(deliveryDate).toISOString(),
          goalAmount: goal,
          splitType,
          message,
          productIds: selectedProductIds.length ? selectedProductIds : [allProducts[0]?.id].filter(Boolean),
          contributors: contributorPayload,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? "Could not create the group gift."); setLoading(false); return; }
      router.push(`/group-gifts/${data.groupGift.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const equalPer = people.length ? Math.round(goal / people.length) : 0;
  const equalTotal = equalPer * people.length;
  const customTotal = people.reduce((s, _n, i) => s + (Number(customAmounts[i]) || 0), 0);
  const customDiff = goal - customTotal;

  return (
    <div className="pb-10">
      <CustomerHeader />
      <main className="mx-auto max-w-md px-4 py-4">
        <div className="mb-1 flex items-center gap-2.5">
          <button onClick={() => router.push("/group-gifts")} className="text-lg text-ink">←</button>
          <div>
            <p className="font-serif text-base font-bold text-ink">Create Group Gift</p>
            <p className="text-xs text-muted">Set up the details and invite friends to contribute.</p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-4 space-y-1">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-muted">Selected gifts</p>
          {selectedProducts.map((p) => (
            <div key={p.id} className="mb-2 flex items-center gap-2.5 rounded-xl border border-border bg-white p-2.5">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-blush text-xl">{p.icon}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">{p.name}</p>
                <p className="text-xs text-muted">{p.store.name}</p>
              </div>
              <p className="text-sm font-bold text-rose">{formatINR(p.price)}</p>
              {selectedProductIds.length > 1 && (
                <button
                  type="button"
                  onClick={() => setSelectedProductIds((ids) => ids.filter((id) => id !== p.id))}
                  className="font-bold text-rose"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" className="mb-3 w-full" onClick={() => setPickerOpen(true)}>
            + Add another gift
          </Button>

          <Label>Recipient Name</Label>
          <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="e.g. Priya Sharma" required />

          <p className="mb-1.5 mt-3.5 text-sm font-semibold text-ink">Occasion Type</p>
          <div className="mb-1 flex flex-wrap gap-2">
            {Object.keys(OCCASION_ICONS).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setOccasionType(t)}
                className={`rounded-full border-[1.5px] px-3.5 py-1.5 text-xs font-semibold ${
                  occasionType === t ? "border-rose bg-blush text-rose" : "border-border bg-white text-ink"
                }`}
              >
                {OCCASION_ICONS[t]} {t}
              </button>
            ))}
          </div>

          <div className="mt-3.5">
            <Label>Delivery City</Label>
            <Select value={deliveryCityId} onChange={(e) => setDeliveryCityId(e.target.value)}>
              {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>

          <div className="mt-3">
            <Label>Delivery Date</Label>
            <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} required />
          </div>

          <div className="mt-3">
            <Label>Group Goal Amount (₹)</Label>
            <Input
              type="number"
              min={1}
              value={goalAmount}
              onChange={(e) => { setGoalAmount(e.target.value); setGoalTouched(true); }}
            />
            <p className="-mt-0.5 text-[11px] text-muted">
              Defaults to the total price of selected gifts ({formatINR(selectedTotal)}) — edit if you&apos;d like a different goal.
            </p>
          </div>

          <p className="mb-1.5 mt-3.5 text-sm font-semibold text-ink">Split Type</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSplitType("equal")}
              className={`flex-1 rounded-xl border-[1.5px] py-2 text-xs font-semibold ${
                splitType === "equal" ? "border-rose bg-blush text-rose" : "border-border bg-white text-ink"
              }`}
            >
              ⊙ Equal Split
            </button>
            <button
              type="button"
              onClick={() => setSplitType("custom")}
              className={`flex-1 rounded-xl border-[1.5px] py-2 text-xs font-semibold ${
                splitType === "custom" ? "border-rose bg-blush text-rose" : "border-border bg-white text-ink"
              }`}
            >
              Custom Amount
            </button>
          </div>

          {splitType === "equal" ? (
            <div className="mt-2.5 rounded-xl border border-border bg-white p-3">
              <p className="mb-2 text-xs font-bold text-ink">Contribution breakdown</p>
              {people.map((n) => (
                <div key={n} className="flex justify-between py-0.5 text-xs">
                  <span>{n}</span>
                  <span className="font-semibold">{formatINR(equalPer)}</span>
                </div>
              ))}
              <div className="mt-1.5 flex justify-between border-t border-border pt-1.5 text-xs font-bold">
                <span>Total</span>
                <span className={equalTotal === goal ? "text-emerald-700" : "text-red-600"}>
                  {formatINR(equalTotal)}{equalTotal === goal ? " ✓ matches goal" : ` (goal: ${formatINR(goal)})`}
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-2.5 rounded-xl border border-border bg-white p-3">
              <p className="mb-2 text-xs font-bold text-ink">Enter each person&apos;s amount</p>
              {people.map((n, i) => (
                <div key={n} className="flex items-center justify-between gap-2 py-0.5">
                  <span className="flex-1 text-xs">{n}</span>
                  <input
                    type="number"
                    min={0}
                    value={customAmounts[i] ?? ""}
                    onChange={(e) => setCustomAmounts((a) => ({ ...a, [i]: e.target.value }))}
                    placeholder="₹0"
                    className="w-24 rounded-lg border border-border px-2 py-1 text-xs"
                  />
                </div>
              ))}
              <div className="mt-1.5 border-t border-border pt-1.5">
                <div className="flex justify-between text-xs font-bold"><span>Total entered</span><span>{formatINR(customTotal)}</span></div>
                <p className={`mt-1 text-[11px] font-semibold ${customDiff === 0 ? "text-emerald-700" : customDiff > 0 ? "text-amber-700" : "text-red-600"}`}>
                  {customDiff === 0
                    ? `✓ Matches the goal amount of ${formatINR(goal)} exactly`
                    : customDiff > 0
                    ? `${formatINR(customDiff)} still needed to reach the ${formatINR(goal)} goal`
                    : `${formatINR(Math.abs(customDiff))} more than the ${formatINR(goal)} goal`}
                </p>
              </div>
            </div>
          )}

          <Label className="mt-3.5">Add Contributors</Label>
          <div className="flex gap-2">
            <Input
              value={contributorInput}
              onChange={(e) => setContributorInput(e.target.value)}
              placeholder="Friend's name (optional)"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addContributor(); } }}
            />
            <Button type="button" onClick={addContributor} className="px-4">+</Button>
          </div>
          {contributors.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {contributors.map((name, i) => (
                <span key={i} className="flex items-center gap-1.5 rounded-full bg-blush px-3 py-1 text-xs font-semibold text-ink">
                  {name}
                  <button type="button" onClick={() => setContributors((c) => c.filter((_, idx) => idx !== i))} className="font-bold text-rose">✕</button>
                </span>
              ))}
            </div>
          )}

          <p className="mb-1.5 mt-3.5 text-sm font-semibold text-ink">Invite Method</p>
          <div className="flex gap-2">
            <Button type="button" className="flex-1 bg-emerald-600 hover:bg-emerald-700">💬 WhatsApp</Button>
            <Button type="button" variant="outline" className="flex-1" onClick={copyLink}>
              🔗 {linkCopied ? "Copied!" : "Copy Link"}
            </Button>
          </div>

          <Label className="mt-3.5">Optional Group Message</Label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            placeholder="Let's make it extra special!"
            className="w-full rounded-2xl border border-border px-3 py-2 text-sm outline-none"
          />

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <Button type="submit" disabled={loading} className="mt-3.5 w-full">
            {loading ? "Creating…" : "Create & Invite →"}
          </Button>
        </form>
      </main>

      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45" onClick={() => setPickerOpen(false)}>
          <div
            className="max-h-[75vh] w-full max-w-md overflow-y-auto rounded-t-[22px] bg-background p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3.5 h-1 w-10 rounded-full bg-border" />
            <div className="flex items-center justify-between">
              <p className="font-serif text-sm font-bold text-ink">Choose a gift</p>
              <button
                onClick={() => setPickerOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-rose text-sm text-white"
              >
                ✕
              </button>
            </div>
            {allProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedProductIds((ids) => (ids.includes(p.id) ? ids : [...ids, p.id]));
                  setPickerOpen(false);
                }}
                className="mt-2.5 flex w-full items-center gap-2.5 rounded-xl border border-border bg-white p-2.5 text-left"
              >
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-blush text-xl">{p.icon}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{p.name}</p>
                  <p className="text-xs text-muted">{p.store.name}</p>
                </div>
                <p className="text-sm font-bold text-rose">{formatINR(p.price)}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
