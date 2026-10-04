"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, PartyPopper, Package } from "lucide-react";

const ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/reminders", label: "Reminders", icon: Calendar },
  { href: "/group-gifts", label: "Group", icon: PartyPopper },
  { href: "/orders", label: "Orders", icon: Package },
];

export function CustomerBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
              active ? "text-rose" : "text-muted"
            }`}
          >
            <Icon size={18} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
