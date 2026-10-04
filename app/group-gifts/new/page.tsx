"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CustomerHeader } from "@/components/CustomerHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { OCCASIONS } from "@/lib/constants";

interface City { id: string; name: string }

export default function NewGroupGiftPage() {
  const router = useRouter();
  const [cities, setCities] = useState<City[]>([]);
  const [recipientName, setRecipientName] = useState("");
  const [occasionType, setOccasionType] = useState<string>("Birthday");
  const [deliveryCityId, setDeliveryCityId] = useState("hyd");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [message, setMessage] = useState("");
  const [contributorNames, setContributorNames] = useState("You, Friend 1, Friend 2");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/cities").then((r) => r.json()).then((d) => setCities(d.cities));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const goal = Number(goalAmount);
    if (!recipientName || recipientName.length < 2) { setError("Enter a recipient name."); return; }
    if (!deliveryDate) { setError("Pick a delivery date."); return; }
    if (!goal || goal <= 0) { setError("Enter a goal amount greater than 0."); return; }
    const people = contributorNames.split(",").map((n) => n.trim()).filter(Boolean);
    if (people.length === 0) { setError("Add at least one contributor."); return; }
    const perPerson = Math.round(goal / people.length);

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
          splitType: "equal",
          message,
          productIds: ["placeholder"],
          contributors: people.map((n, i) => ({ name: n, amount: perPerson, paid: i === 0 })),
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

  return (
    <div className="pb-10">
      <CustomerHeader />
      <main className="mx-auto max-w-md px-4 py-4">
        <h1 className="mb-4 font-serif text-xl font-semibold text-ink">Create Group Gift</h1>
        <form onSubmit={submit} className="space-y-3 rounded-3xl border border-border bg-white p-4">
          <div>
            <Label>Recipient name</Label>
            <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} required />
          </div>
          <div>
            <Label>Occasion</Label>
            <Select value={occasionType} onChange={(e) => setOccasionType(e.target.value)}>
              {[...OCCASIONS, "Wedding", "Anniversary"].map((o) => <option key={o} value={o}>{o}</option>)}
            </Select>
          </div>
          <div>
            <Label>Delivery city</Label>
            <Select value={deliveryCityId} onChange={(e) => setDeliveryCityId(e.target.value)}>
              {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <div>
            <Label>Delivery date</Label>
            <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} required />
          </div>
          <div>
            <Label>Goal Amount (₹)</Label>
            <Input type="number" min={1} value={goalAmount} onChange={(e) => setGoalAmount(e.target.value)} required />
          </div>
          <div>
            <Label>Contributors (comma-separated names)</Label>
            <Input value={contributorNames} onChange={(e) => setContributorNames(e.target.value)} />
          </div>
          <div>
            <Label>Optional group message</Label>
            <Input value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">{loading ? "Creating…" : "Create group gift"}</Button>
        </form>
      </main>
    </div>
  );
}
