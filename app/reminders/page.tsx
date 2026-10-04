"use client";
import { useEffect, useState } from "react";
import { CustomerHeader } from "@/components/CustomerHeader";
import { CustomerBottomNav } from "@/components/CustomerBottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OCCASIONS } from "@/lib/constants";

interface Reminder {
  id: string; occasionName: string; recipientName: string; occasionType: string; date: string;
  repeatYearly: boolean; remindMe: string; giftCategory: string | null; note: string | null;
}

const EMPTY_FORM = {
  occasionName: "", recipientName: "", occasionType: "Birthday", date: "",
  repeatYearly: true, remindMe: "1 week before", giftCategory: "", note: "",
};

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    fetch("/api/reminders").then((r) => r.json()).then((d) => setReminders(d.reminders ?? []));
  }
  useEffect(load, []);

  function startEdit(r: Reminder) {
    setForm({
      occasionName: r.occasionName, recipientName: r.recipientName, occasionType: r.occasionType,
      date: r.date.slice(0, 10), repeatYearly: r.repeatYearly, remindMe: r.remindMe,
      giftCategory: r.giftCategory ?? "", note: r.note ?? "",
    });
    setEditingId(r.id);
    setShowForm(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const url = editingId ? `/api/reminders/${editingId}` : "/api/reminders";
    const res = await fetch(url, {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.message ?? "Could not save the reminder."); return; }
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this reminder? This can't be undone.")) return;
    await fetch(`/api/reminders/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="pb-20 sm:pb-10">
      <CustomerHeader />
      <main className="mx-auto max-w-2xl px-4 py-4">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="font-serif text-xl font-semibold text-ink">Occasion Reminders</h1>
          <Button
            size="sm"
            onClick={() => {
              setForm(EMPTY_FORM);
              setEditingId(null);
              setShowForm((v) => !v);
            }}
          >
            {showForm ? "Close" : "+ Add"}
          </Button>
        </div>

        {showForm && (
          <form onSubmit={submit} className="mb-5 space-y-3 rounded-3xl border border-border bg-white p-4">
            <div>
              <Label>Occasion name</Label>
              <Input
                value={form.occasionName}
                onChange={(e) => setForm((f) => ({ ...f, occasionName: e.target.value }))}
                placeholder="e.g. Priyanka's Birthday"
                required
              />
            </div>
            <div>
              <Label>Recipient name</Label>
              <Input
                value={form.recipientName}
                onChange={(e) => setForm((f) => ({ ...f, recipientName: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Occasion type</Label>
                <select
                  value={form.occasionType}
                  onChange={(e) => setForm((f) => ({ ...f, occasionType: e.target.value }))}
                  className="h-11 w-full rounded-2xl border border-border px-3 text-sm"
                >
                  {[...OCCASIONS, "Wedding"].map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
              </div>
            </div>
            <div>
              <Label>Remind me</Label>
              <select
                value={form.remindMe}
                onChange={(e) => setForm((f) => ({ ...f, remindMe: e.target.value }))}
                className="h-11 w-full rounded-2xl border border-border px-3 text-sm"
              >
                {["3 days before", "1 week before", "1 month before"].map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-ink/80">
              <input
                type="checkbox"
                checked={form.repeatYearly}
                onChange={(e) => setForm((f) => ({ ...f, repeatYearly: e.target.checked }))}
              />
              Repeats every year
            </label>
            <div>
              <Label>Note (optional)</Label>
              <Input value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
            </div>
            {error && <p className="text-sm font-medium text-red-600">{error}</p>}
            <Button type="submit" className="w-full">{editingId ? "Save changes" : "Save reminder"}</Button>
          </form>
        )}

        <div className="space-y-2">
          {reminders.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">{r.occasionName}</p>
                <span className="text-xs text-muted">{new Date(r.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
              </div>
              <p className="text-xs text-muted">For {r.recipientName} · {r.occasionType}</p>
              {r.note && <p className="mt-1 text-xs text-ink/70">{r.note}</p>}
              <div className="mt-2 flex gap-3 text-xs font-semibold">
                <button onClick={() => startEdit(r)} className="text-ink">Edit</button>
                <button onClick={() => remove(r.id)} className="text-red-600">Delete</button>
              </div>
            </div>
          ))}
          {reminders.length === 0 && !showForm && <p className="py-6 text-center text-sm text-muted">No reminders yet.</p>}
        </div>
      </main>
      <CustomerBottomNav />
    </div>
  );
}
