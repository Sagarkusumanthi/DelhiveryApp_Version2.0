"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Gift, LayoutDashboard, Package, ClipboardList, Store as StoreIcon } from "lucide-react";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin/stores", label: "Stores", icon: StoreIcon },
  { href: "/admin/products", label: "Products", icon: Package },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <aside className="flex items-center justify-between gap-2 border-b border-border p-4 sm:w-56 sm:flex-shrink-0 sm:flex-col sm:items-stretch sm:justify-start sm:border-b-0 sm:border-r sm:p-5">
        <Link href="/admin/dashboard" className="flex items-center gap-2 font-serif text-lg font-semibold text-ink">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose text-white">
            <Gift size={16} />
          </span>
          Giftly Admin
        </Link>
        <nav className="hidden flex-1 flex-col gap-1 sm:mt-6 sm:flex">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium ${
                pathname === href ? "bg-rose text-white" : "text-ink hover:bg-blush/60"
              }`}
            >
              <Icon size={16} /> {label}
            </Link>
          ))}
        </nav>
        <button onClick={logout} className="hidden text-xs font-semibold text-red-600 sm:mt-auto sm:block sm:text-left">
          Log out
        </button>
      </aside>
      <main className="flex-1 p-4 sm:p-6">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-background/95 sm:hidden">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
              pathname === href ? "text-rose" : "text-muted"
            }`}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
