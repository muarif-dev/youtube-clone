"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  ArrowLeft,
  Bell,
  Clapperboard,
  Menu,
  Radio,
  Search,
  ThumbsUp,
  Upload,
  X,
  UserRound,
  Library,
  Settings,
  LogOut,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSidebar } from "./SidebarProvider";
import { formatRelativeDate } from "@/lib/video";

interface INotification {
  _id: string;
  type: "like" | "subscription" | "upload";
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  sender?: { name?: string; channelName?: string; image?: string } | null;
  videoId?: { _id: string; title?: string; thumbnailUrl?: string } | string | null;
}

function NotificationIcon({ type }: { type: INotification["type"] }) {
  if (type === "like") return <ThumbsUp className="h-4 w-4 text-white" />;
  if (type === "subscription") return <Radio className="h-4 w-4 text-white" />;
  return <Clapperboard className="h-4 w-4 text-white" />;
}

export default function AppHeader() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [query, setQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const { toggleCollapsed, toggleMobile } = useSidebar();

  useEffect(() => {
    if (mobileSearchOpen) {
      mobileSearchInputRef.current?.focus();
    }
  }, [mobileSearchOpen]);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;

    const loadNotifications = async () => {
      try {
        const res = await fetch("/api/notifications", { credentials: "same-origin" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
        setUnreadCount(Number(data.unreadCount) || 0);
      } catch (err) {
        console.error("Unable to load notifications:", err);
      }
    };

    loadNotifications();
    const interval = window.setInterval(loadNotifications, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [status]);

  const submitSearch = (rawQuery: string) => {
    const nextQuery = rawQuery.trim();
    router.push(nextQuery ? `/search?q=${encodeURIComponent(nextQuery)}` : "/search");
  };

  const closeMenus = () => {
    setNotificationsOpen(false);
    setMenuOpen(false);
  };

  const displayName = session?.user?.name?.trim() || session?.user?.email?.split("@")[0] || "Profile";

  const handleMenuToggle = () => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
      toggleMobile();
    } else {
      toggleCollapsed();
    }
  };

  const handleNotificationsClick = async () => {
    const nextOpen = !notificationsOpen;
    setNotificationsOpen(nextOpen);
    setMenuOpen(false);

    if (nextOpen && unreadCount > 0) {
      setUnreadCount(0);
      setNotificationsLoading(true);
      setNotifications((current) => current.map((item) => ({ ...item, read: true })));
      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
      } catch (err) {
        console.error("Unable to mark notifications as read:", err);
      } finally {
        setNotificationsLoading(false);
      }
    }
  };

  const handleAvatarClick = () => {
    setMenuOpen((current) => !current);
    setNotificationsOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 h-14 border-b border-[#272727] bg-[#0F0F0F]">
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
              submitSearch(query);
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
          <button
            type="button"
            onClick={() => setMobileSearchOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-yt-hover md:hidden"
            aria-label="Search"
          >
            <Search className="h-6 w-6" />
          </button>
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
              {unreadCount > 0 && !notificationsOpen ? (
                <span className="absolute right-1 top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-yt-red px-1 py-0.5 text-[10px] font-bold text-white ring-2 ring-yt-bg">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
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
                  <div className="max-h-80 overflow-y-auto">
                    {notificationsLoading ? (
                      <div className="px-4 py-6 text-center text-xs text-yt-secondary">Loading notifications...</div>
                    ) : notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-yt-secondary">
                        No notifications yet. Likes, subscriptions, and new uploads will show up here.
                      </div>
                    ) : (
                      notifications.map((notification) => {
                        const videoHref =
                          notification.videoId && typeof notification.videoId === "object"
                            ? `/watch/${notification.videoId._id}`
                            : null;
                        const inner = (
                          <>
                            <span
                              className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                notification.read ? "bg-yt-hover" : "bg-yt-red/20"
                              }`}
                            >
                              <NotificationIcon type={notification.type} />
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-white">{notification.title}</p>
                              {notification.body ? (
                                <p className="mt-0.5 line-clamp-2 text-xs text-yt-secondary">{notification.body}</p>
                              ) : null}
                              <p className="mt-1 text-[11px] text-yt-secondary">
                                {formatRelativeDate(notification.createdAt)}
                              </p>
                            </div>
                          </>
                        );
                        const rowClass = `flex gap-3 border-b border-yt-border/60 px-4 py-3 transition hover:bg-yt-hover ${
                          notification.read ? "opacity-70" : ""
                        }`;
                        return videoHref ? (
                          <Link
                            key={notification._id}
                            href={videoHref}
                            onClick={() => setNotificationsOpen(false)}
                            className={rowClass}
                          >
                            {inner}
                          </Link>
                        ) : (
                          <div key={notification._id} className={rowClass}>
                            {inner}
                          </div>
                        );
                      })
                    )}
                  </div>
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
                className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-transparent transition hover:opacity-80"
                aria-label="Account menu"
              >
                {session.user?.image ? (
                  <img src={session.user.image} alt={displayName} className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-600">
                    <UserRound className="h-5 w-5 text-gray-300" />
                  </span>
                )}
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
                        onClick={() => {
                          setNotifications([]);
                          setUnreadCount(0);
                          signOut({ callbackUrl: "/" });
                        }}
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
              <UserRound className="h-5 w-5 text-yt-secondary" />
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Mobile search overlay */}
      {mobileSearchOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/70 md:hidden"
          onClick={() => setMobileSearchOpen(false)}
        >
          <form
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              const nextQuery = query.trim();
              setMobileSearchOpen(false);
              submitSearch(nextQuery);
            }}
            className="sticky top-0 flex h-14 items-center gap-2 border-b border-[#272727] bg-[#0F0F0F] px-3"
          >
            <button
              type="button"
              onClick={() => setMobileSearchOpen(false)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition hover:bg-yt-hover"
              aria-label="Close search"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <label htmlFor="mobile-overlay-search" className="sr-only">
              Search videos
            </label>
            <input
              id="mobile-overlay-search"
              ref={mobileSearchInputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-white outline-none placeholder:text-yt-secondary"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-yt-secondary transition hover:text-white"
                aria-label="Clear search"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            <button
              type="submit"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yt-hover text-white transition hover:bg-white/20"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
