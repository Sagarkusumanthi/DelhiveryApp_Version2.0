"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, Loader2 } from "lucide-react";

const DEMO_ACCOUNTS = [
  { label: "Use demo Customer", email: "customer@giftapp.demo" },
  { label: "Use demo Store Owner", email: "store@giftapp.demo" },
  { label: "Use demo Admin", email: "admin@giftapp.demo" },
];
const DEMO_PASSWORD = "Demo@1234";

const ROLE_HOME: Record<string, string> = {
  CUSTOMER: "/",
  STORE_OWNER: "/store/dashboard",
  ADMIN: "/admin/dashboard",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get("session_expired");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e?: React.FormEvent, overrideIdentifier?: string, overridePassword?: string) {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: overrideIdentifier ?? identifier,
          password: overridePassword ?? password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Invalid email/phone or password.");
        setLoading(false);
        return;
      }
      router.push(ROLE_HOME[data.user.role] ?? "/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-blush/40 px-4 py-10">
      <div className="mb-6 flex items-center gap-2">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose text-white shadow">
          <Gift size={22} />
        </span>
        <div>
          <p className="font-serif text-xl font-semibold text-ink">Giftly</p>
          <p className="text-xs text-muted">Send a little love</p>
        </div>
      </div>

      <div className="w-full max-w-sm rounded-3xl border border-border bg-white p-6 shadow-sm">
        {sessionExpired && (
          <div className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
            Your session doesn&apos;t have access to that page — please sign in with the right account.
          </div>
        )}
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label htmlFor="identifier">Email or Phone Number</Label>
            <Input
              id="identifier"
              placeholder="you@example.com or 98XXXXXXXX"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="animate-spin" size={16} /> : "Sign in"}
          </Button>
        </form>

        <div className="my-4 flex items-center gap-2 text-xs text-muted">
          <div className="h-px flex-1 bg-border" />
          or continue as
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="space-y-2">
          {DEMO_ACCOUNTS.map((d) => (
            <Button
              key={d.email}
              type="button"
              variant="outline"
              className="w-full"
              disabled={loading}
              onClick={() => {
                setIdentifier(d.email);
                setPassword(DEMO_PASSWORD);
                submit(undefined, d.email, DEMO_PASSWORD);
              }}
            >
              {d.label}
            </Button>
          ))}
        </div>
        <p className="mt-3 text-center text-[11px] text-muted">
          Tapping a role above signs you in with its demo account.
        </p>
      </div>
      <p className="mt-6 max-w-xs text-center text-[11px] text-muted">
        Demo application — no real payments or deliveries.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
