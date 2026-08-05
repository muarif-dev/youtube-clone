"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Bell,
  Menu,
  Plus,
  Search,
  Upload,
  X,
  Check,
  ChevronDown,
  UserRound,
  Library,
  Settings,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { useSidebar } from "./SidebarProvider";

const sampleNotifications = [
  {
    id: "n1",
    title: "New subscriber",
    body: "A new viewer subscribed to your channel.",
    time: "2h ago",
  },
  {
    id: "n2",
    title: "New comment",
    body: "A viewer commented on your latest video.",
    time: "5h ago",
  },
  {
    id: "n3",
    title: "Milestone reached",
    body: "Your video passed 1,000 views. Nice work!",
    time: "1d ago",
  },
];

export default function AppHeader() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [query, setQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const { toggleCollapsed, toggleMobile } = useSidebar();

  const displayName = session?.user?.name?.trim() || session?.user?.email?.split("@")[0] || "Profile";

  const handleMenuToggle = () => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
      toggleMobile();
    } else {
      toggleCollapsed();
    }
  };

  const handleNotificationsClick = () => {
    setNotificationsOpen((current) => !current);
    setMenuOpen(false);
    setHasUnread(false);
  };

  const handleAvatarClick = () => {
    setMenuOpen((current) => !current);
    setNotificationsOpen(false);
  };

  const closeMenus = () => {
    setNotificationsOpen(false);
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-yt-border bg-yt-bg/95 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-full items-center justify-between gap-2 px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-1">
          <button
            type="button"
            onClick={handleMenuToggle}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition hover:bg-yt-hover"
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <Link href="/" className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-lg font-semibold tracking-tight text-white">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-yt-red text-white">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            <span className="hidden sm:inline">YouTube</span>
          </Link>
        </div>

        <div className="hidden flex-1 items-center justify-center px-4 md:flex">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const nextQuery = query.trim();
              router.push(nextQuery ? `/search?q=${encodeURIComponent(nextQuery)}` : "/search");
            }}
            className="flex w-full max-w-xl items-stretch overflow-hidden rounded-full border border-yt-border bg-[#121212] shadow-inner"
          >
            <label htmlFor="header-search" className="sr-only">
              Search videos
            </label>
            <input
              id="header-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              className="min-w-0 flex-1 bg-transparent px-4 py-2 text-sm text-white outline-none placeholder:text-yt-secondary"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="inline-flex w-10 shrink-0 items-center justify-center text-yt-secondary transition hover:text-white"
                aria-label="Clear search"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            <button
              type="submit"
              className="inline-flex w-16 items-center justify-center border-l border-yt-border text-yt-secondary transition hover:bg-yt-hover hover:text-white"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
          </form>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link
            href="/upload"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-yt-card px-2 text-sm font-medium text-white transition hover:bg-yt-hover sm:px-4"
            title="Upload a video"
          >
            <Upload className="h-5 w-5" />
            <span className="hidden sm:inline">Upload</span>
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={handleNotificationsClick}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-yt-hover"
              aria-label="Notifications"
            >
              <Bell className="h-6 w-6" />
              {hasUnread && !notificationsOpen ? (
                <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-yt-red ring-2 ring-yt-bg" />
              ) : null}
            </button>
            {notificationsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-yt-border bg-[#282828] shadow-2xl">
                  <div className="flex items-center justify-between border-b border-yt-border px-4 py-3">
                    <p className="text-sm font-semibold text-white">Notifications</p>
                    <button
                      type="button"
                      onClick={() => setNotificationsOpen(false)}
                      className="rounded-full p-1 text-yt-secondary transition hover:bg-yt-hover hover:text-white"
                      aria-label="Close notifications"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <ul className="max-h-80 overflow-y-auto">
                    {sampleNotifications.map((notification) => (
                      <li
                        key={notification.id}
                        className="flex gap-3 border-b border-yt-border/60 px-4 py-3 transition hover:bg-yt-hover"
                      >
                        <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yt-hover">
                          <Check className="h-4 w-4 text-yt-secondary" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white">{notification.title}</p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-yt-secondary">{notification.body}</p>
                          <p className="mt-1 text-[11px] text-yt-secondary">{notification.time}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <p className="px-4 py-3 text-center text-xs text-yt-secondary">No more notifications to show.</p>
                </div>
              </>
            )}
          </div>

          {status === "loading" ? (
            <div className="h-10 w-10 animate-pulse rounded-full bg-yt-hover" />
          ) : session ? (
            <div className="relative">
              <button
                type="button"
                onClick={handleAvatarClick}
                className="inline-flex h-10 min-w-10 items-center justify-center gap-1 rounded-full bg-[#111111] px-2 text-sm font-medium text-white ring-1 ring-white/20 transition hover:bg-yt-hover"
                aria-label="Account menu"
              >
                {displayName.charAt(0).toUpperCase()}
                <ChevronDown className="hidden h-4 w-4 text-yt-secondary sm:block" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={closeMenus} />
                  <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-yt-border bg-[#282828] shadow-2xl">
                    <div className="border-b border-yt-border px-4 py-4">
                      <p className="text-sm font-semibold text-white">{displayName}</p>
                      {session.user?.email ? (
                        <p className="mt-0.5 truncate text-xs text-yt-secondary">{session.user.email}</p>
                      ) : null}
                    </div>
                    <ul className="py-2">
                      <li>
                        <Link
                          href="/channel"
                          onClick={closeMenus}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-white transition hover:bg-yt-hover"
                        >
                          <UserRound className="h-5 w-5 text-yt-secondary" />
                          Your Channel
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/library"
                          onClick={closeMenus}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-white transition hover:bg-yt-hover"
                        >
                          <Library className="h-5 w-5 text-yt-secondary" />
                          Library
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/channel"
                          onClick={closeMenus}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-white transition hover:bg-yt-hover"
                        >
                          <Settings className="h-5 w-5 text-yt-secondary" />
                          Settings
                        </Link>
                      </li>
                    </ul>
                    <div className="border-t border-yt-border py-2">
                      <button
                        type="button"
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-white transition hover:bg-yt-hover"
                      >
                        <LogOut className="h-5 w-5 text-yt-secondary" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              href="/auth/signin"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-yt-border bg-yt-card px-4 text-sm font-medium text-white transition hover:bg-yt-hover"
            >
              <Plus className="h-5 w-5" />
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Mobile search bar */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const nextQuery = query.trim();
          router.push(nextQuery ? `/search?q=${encodeURIComponent(nextQuery)}` : "/search");
        }}
        className="flex items-stretch gap-2 px-3 pb-2 md:hidden"
      >
        <div className="relative flex min-w-0 flex-1 items-center">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            className="min-w-0 w-full rounded-full border border-yt-border bg-[#121212] px-4 py-2 pr-10 text-sm text-white outline-none placeholder:text-yt-secondary"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-yt-secondary transition hover:text-white"
              aria-label="Clear search"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="inline-flex w-12 items-center justify-center rounded-full bg-yt-card text-yt-secondary transition hover:bg-yt-hover hover:text-white"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </button>
      </form>
    </header>
  );
}
