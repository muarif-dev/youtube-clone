"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Home", href: "/", icon: "M3 9.5L12 3l9 6.5V21a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-5H9v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" },
  { label: "Shorts", href: "/shorts", icon: "M6 4l12 8-12 8V4z" },
  { label: "Subscriptions", href: "/subscriptions", icon: "M5 19h14V5H5v14zm7-12a3 3 0 100 6 3 3 0 000-6z" },
  { label: "Library", href: "/library", icon: "M4 6h4v14H4zm6 0h4v14h-4zm6 0h4v14h-4z" },
  { label: "My Channel", href: "/channel", icon: "M12 12a5 5 0 100-10 5 5 0 000 10zm-7 9a7 7 0 0114 0H5z" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 min-h-screen border-r border-neutral-800 bg-[#0F0F0F] px-3 py-6 md:block">
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                isActive ? "bg-[#272727] text-white" : "text-slate-300 hover:bg-[#272727] hover:text-white"
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                <path d={item.icon} />
              </svg>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
