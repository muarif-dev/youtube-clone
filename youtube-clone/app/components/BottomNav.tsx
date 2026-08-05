"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, SquarePlay, Radio, Library } from "lucide-react";

const items = [
  { label: "Home", href: "/", icon: Home },
  { label: "Shorts", href: "/shorts", icon: SquarePlay },
  { label: "Subscriptions", href: "/subscriptions", icon: Radio },
  { label: "Library", href: "/library", icon: Library },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#272727] bg-[#0F0F0F] md:hidden">
      <div className="grid grid-cols-4 pb-[env(safe-area-inset-bottom)]">
        {items.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition ${
                active ? "text-white" : "text-yt-secondary hover:text-white"
              }`}
            >
              <Icon className={`h-6 w-6 ${active ? "fill-current" : ""}`} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
