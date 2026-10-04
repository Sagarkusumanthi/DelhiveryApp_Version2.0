"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift } from "lucide-react";

// Matches the original prototype's DEMO_USERS exactly.
const DEMO_ACCOUNTS: Record<string, { label: string; email: string }> = {
  CUSTOMER: { label: "Customer", email: "ananya.rao@giftly.app" },
  STORE_OWNER: { label: "Store Owner", email: "priya.nair@giftly.app" },
  ADMIN: { label: "Admin", email: "admin@giftly.app" },
};
const DEMO_PASSWORD = "Demo@1234";

const ROLE_HOME: Record<string, string> = {
  CUSTOMER: "/",
  STORE_OWNER: "/store/dashboard",
  ADMIN: "/admin/dashboard",
};

type LoginView = "signin" | "forgot-identifier" | "forgot-otp";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get("session_expired");

  const [view, setView] = useState<LoginView>("signin");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Forgot-password (fully simulated client-side, matching the original
  // prototype — no email/SMS is actually sent, and no password is actually
  // changed; this is a demo flow only).
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [forgotIdError, setForgotIdError] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [retypePassword, setRetypePassword] = useState("");
  const [newPwError, setNewPwError] = useState("");

  function fillDemo(role: keyof typeof DEMO_ACCOUNTS) {
    setIdentifier(DEMO_ACCOUNTS[role].email);
    setPassword(DEMO_PASSWORD);
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier || !password) {
      setError("Enter your email/phone and password.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Incorrect email/phone or password. Try one of the demo accounts below.");
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

  function sendOtp() {
    setForgotIdError("");
    if (!forgotIdentifier.trim()) {
      setForgotIdError("Enter your email or phone number.");
      return;
    }
    setView("forgot-otp");
  }

  function resetPassword() {
    setOtpError("");
    setNewPwError("");
    if (!otp || otp.trim().length < 4) {
      setOtpError("Enter the OTP sent to you (demo - any 4-6 digits).");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setNewPwError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== retypePassword) {
      setNewPwError("Passwords do not match.");
      return;
    }
    // demo only: does not actually change any stored credential
    setView("signin");
    setForgotSuccess(true);
    setIdentifier("");
    setPassword("");
    setForgotIdentifier("");
    setOtp("");
    setNewPassword("");
    setRetypePassword("");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-blush px-6 py-10">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose text-xl text-white">🎁</span>
        <p className="font-serif text-[22px] font-bold text-ink">Giftly</p>
      </div>
      <p className="mb-5 text-sm text-muted">Send a little love</p>

      <div className="w-full max-w-[340px] rounded-2xl border border-border bg-white p-5 shadow-sm">
        {view === "signin" && (
          <>
            {forgotSuccess && (
              <div className="mb-3 rounded-[10px] bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-800">
                ✓ Password reset successfully (demo). Sign in with your usual demo credentials below.
              </div>
            )}
            {sessionExpired && (
              <div className="mb-3 rounded-[10px] bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-800">
                Please sign in with an account that has access to that page.
              </div>
            )}
            <form onSubmit={submit}>
              <Label>Email or Phone Number</Label>
              <Input
                placeholder="you@example.com or 98XXXXXXXX"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
              <div className="mt-3">
                <Label>Password</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="-mt-1.5 text-right">
                <button
                  type="button"
                  onClick={() => setView("forgot-identifier")}
                  className="text-xs font-bold text-rose"
                >
                  Forgot password?
                </button>
              </div>
              {error && <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>}
              <Button type="submit" disabled={loading} className="mt-2.5 w-full">
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            <div className="my-4 flex items-center gap-2 text-xs text-muted">
              <div className="h-px flex-1 bg-border" />
              or continue as
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="space-y-2">
              {(Object.keys(DEMO_ACCOUNTS) as Array<keyof typeof DEMO_ACCOUNTS>).map((role) => (
                <Button key={role} type="button" variant="outline" className="w-full" onClick={() => fillDemo(role)}>
                  {DEMO_ACCOUNTS[role].label}
                </Button>
              ))}
            </div>
            <p className="mt-2.5 text-center text-[10px] text-muted">
              Tapping a role above fills in its demo credentials — tap Sign in to continue.
            </p>
          </>
        )}

        {view === "forgot-identifier" && (
          <>
            <p className="font-serif text-base font-bold text-ink">Forgot password</p>
            <p className="mb-3.5 mt-1 text-xs text-muted">
              Enter your registered email or phone number and we&apos;ll send a one-time code (demo).
            </p>
            <Label>Email or Phone Number</Label>
            <Input
              placeholder="you@example.com or 98XXXXXXXX"
              value={forgotIdentifier}
              onChange={(e) => setForgotIdentifier(e.target.value)}
            />
            {forgotIdError && <p className="mt-1 text-xs font-semibold text-red-600">{forgotIdError}</p>}
            <Button className="mt-2.5 w-full" onClick={sendOtp}>Send OTP</Button>
            <Button variant="outline" className="mt-2 w-full" onClick={() => setView("signin")}>
              ← Back to sign in
            </Button>
          </>
        )}

        {view === "forgot-otp" && (
          <>
            <p className="font-serif text-base font-bold text-ink">Enter OTP</p>
            <p className="mb-3.5 mt-1 text-xs text-muted">
              We&apos;ve sent a one-time code to <b>{forgotIdentifier}</b> (demo — any 4-6 digits work).
            </p>
            <Label>OTP</Label>
            <Input placeholder="e.g. 123456" value={otp} onChange={(e) => setOtp(e.target.value)} />
            {otpError && <p className="mt-1 text-xs font-semibold text-red-600">{otpError}</p>}
            <div className="mt-2.5">
              <Label>New Password</Label>
              <Input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="mt-2.5">
              <Label>Retype New Password</Label>
              <Input type="password" placeholder="Retype new password" value={retypePassword} onChange={(e) => setRetypePassword(e.target.value)} />
            </div>
            {newPwError && <p className="mt-1 text-xs font-semibold text-red-600">{newPwError}</p>}
            <Button className="mt-2.5 w-full" onClick={resetPassword}>Reset password</Button>
            <Button variant="outline" className="mt-2 w-full" onClick={() => setView("signin")}>
              ← Back to sign in
            </Button>
          </>
        )}
      </div>
      <p className="mt-4 max-w-[320px] text-center text-[11px] text-muted">
        No real payments are processed in this demo.
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
