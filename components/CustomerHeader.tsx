"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Gift, ShoppingCart, User, LogOut } from "lucide-react";
import { useCart } from "@/lib/hooks/useCart";
import { useState } from "react";

export function CustomerHeader() {
  const router = useRouter();
  const { totalQty } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
      <Link href="/" className="flex items-center gap-2 font-serif text-xl font-semibold text-ink">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose text-white shadow">
          <Gift size={18} />
        </span>
        Giftly
      </Link>
      <nav className="hidden items-center gap-5 text-sm font-medium text-ink/80 sm:flex">
        <Link href="/" className="hover:text-ink">Home</Link>
        <Link href="/orders" className="hover:text-ink">Orders</Link>
        <Link href="/reminders" className="hover:text-ink">Reminders</Link>
        <Link href="/group-gifts" className="hover:text-ink">Group Gifting</Link>
      </nav>
      <div className="flex items-center gap-2">
        <Link
          href="/cart"
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-blush text-ink"
          aria-label="Cart"
        >
          <ShoppingCart size={18} />
          {totalQty > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose px-1 text-[10px] font-bold text-white">
              {totalQty}
            </span>
          )}
        </Link>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-blush text-ink"
            aria-label="Account"
          >
            <User size={18} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-12 w-44 overflow-hidden rounded-2xl border border-border bg-white shadow-lg">
              <button
                onClick={logout}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-blush/40"
              >
                <LogOut size={15} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
