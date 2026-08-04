'use client';

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Bell, Menu, Plus, Search } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AppHeader() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [query, setQuery] = useState("");
  const displayName = session?.user?.name?.trim() || session?.user?.email?.split("@")[0] || "Profile";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-200 transition hover:border-slate-700 hover:bg-slate-800">
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-900/90">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-red-600 text-white shadow-sm">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            <span className="hidden sm:inline">YouTube Clone</span>
          </Link>
        </div>

        <div className="hidden flex-1 items-center justify-center sm:flex">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const nextQuery = query.trim();
              if (nextQuery) {
                router.push(`/?query=${encodeURIComponent(nextQuery)}`);
              } else {
                router.push("/");
              }
            }}
            className="flex w-full max-w-2xl items-center overflow-hidden rounded-full border border-slate-800 bg-slate-900/95 shadow-sm"
          >
            <label htmlFor="header-search" className="sr-only">Search videos</label>
            <input
              id="header-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              className="flex-1 bg-transparent px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500"
            />
            <button type="submit" className="inline-flex h-12 w-12 items-center justify-center border-l border-slate-800 bg-slate-900 text-slate-200 transition hover:bg-slate-800">
              <Search className="h-5 w-5" />
            </button>
          </form>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/upload" className="hidden h-11 items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-4 text-sm font-semibold text-white transition hover:border-slate-700 hover:bg-slate-800 sm:inline-flex">
            <Plus className="h-4 w-4" />
            Upload
          </Link>
          <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-200 transition hover:border-slate-700 hover:bg-slate-800">
            <Bell className="h-5 w-5" />
          </button>
          {status === "loading" ? (
            <div className="h-11 w-11 animate-pulse rounded-full bg-slate-800" />
          ) : session ? (
            <Link href="/channel" className="inline-flex h-11 min-w-[3rem] items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-100 transition hover:border-slate-700 hover:bg-slate-800">
              {displayName.charAt(0).toUpperCase()}
            </Link>
          ) : (
            <Link
              href="/auth/signin"
              className="inline-flex h-11 items-center justify-center rounded-full border border-slate-800 bg-slate-900 px-4 text-sm font-semibold text-slate-100 transition hover:border-slate-700 hover:bg-slate-800"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
