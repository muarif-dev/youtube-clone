"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, SquarePlay, Radio, Library, CircleUser, X, Menu } from "lucide-react";
import { useSidebar } from "./SidebarProvider";

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Shorts", href: "/shorts", icon: SquarePlay },
  { label: "Subscriptions", href: "/subscriptions", icon: Radio },
  { label: "Library", href: "/library", icon: Library },
  { label: "My Channel", href: "/channel", icon: CircleUser },
];

function StreamHubLogo({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onNavigate}
      aria-label="Stream Hub Home"
      className="inline-flex shrink-0 items-center gap-2 px-4 py-3 text-lg font-semibold tracking-tight text-white"
    >
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-yt-red text-white">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
      <span className="hidden sm:inline">Stream Hub</span>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { collapsed, mobileOpen, closeMobile, toggleMobile } = useSidebar();

  return (
    <>
      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 md:hidden"
          aria-hidden="true"
          onClick={closeMobile}
        />
      )}

      {/* Mobile slide-out drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 overflow-y-auto border-r border-yt-border bg-yt-bg transition-transform duration-300 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-yt-border pr-3">
          <StreamHubLogo onNavigate={closeMobile} />
          <button
            type="button"
            onClick={toggleMobile}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-yt-secondary hover:bg-yt-hover hover:text-white"
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="space-y-1 px-3 py-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={closeMobile}
                className={`flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-neutral-800 font-semibold text-white"
                    : "text-yt-secondary hover:bg-yt-hover hover:text-white"
                }`}
              >
                <item.icon className="h-6 w-6" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Desktop sidebar: expanded or collapsed mini-bar */}
      <aside
        className={`sticky top-14 hidden h-[calc(100vh-3.5rem)] shrink-0 overflow-y-auto border-r border-yt-border bg-yt-bg transition-[width] duration-200 md:block ${
          collapsed ? "w-[76px]" : "w-60"
        }`}
      >
        <nav className="space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-4 rounded-xl py-3 text-sm font-medium transition ${
                  collapsed ? "justify-center px-0" : "px-4"
                } ${
                  isActive
                    ? "bg-neutral-800 font-semibold text-white"
                    : "text-yt-secondary hover:bg-yt-hover hover:text-white"
                }`}
              >
                <item.icon className="h-6 w-6 shrink-0" />
                <span className={collapsed ? "hidden" : ""}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-yt-border px-4 py-4">
          {collapsed ? (
            <Menu className="mx-auto h-5 w-5 text-yt-secondary" />
          ) : (
            <p className="text-[11px] leading-4 text-yt-secondary">
              Stream Hub
              <br />
              Next.js + MongoDB + Cloudinary
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
