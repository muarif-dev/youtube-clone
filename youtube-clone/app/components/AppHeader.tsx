'use client';

import Link from "next/link";
import { useSession } from "next-auth/react";

export default function AppHeader() {
  const { data: session, status } = useSession();

  const displayName = session?.user?.name?.trim() || session?.user?.email?.split("@")[0] || "Profile";

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="inline-flex items-center gap-3 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-slate-800 transition hover:bg-slate-800">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-red-600 text-white shadow">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            <span>YouTube Clone</span>
          </Link>
        </div>

        <div className="hidden flex-1 items-center justify-center sm:flex">
          <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900/95 px-3 py-2 shadow-sm ring-1 ring-slate-800 focus-within:border-slate-600">
            <label htmlFor="site-search" className="sr-only">Search videos</label>
            <div className="flex items-center gap-2">
              <input
                id="site-search"
                type="text"
                placeholder="Search videos, channels, and more"
                className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
              />
              <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-800 text-slate-300 transition hover:bg-slate-700">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/upload" className="hidden items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:border-slate-600 hover:bg-slate-800 sm:inline-flex">
            <span className="text-lg">+</span>
            <span>Upload</span>
          </Link>

          {status === "loading" ? (
            <div className="h-10 w-24 animate-pulse rounded-full bg-slate-800" />
          ) : session ? (
            <Link href="/channel" className="inline-flex items-center gap-3 rounded-full border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-600 hover:bg-slate-800">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-sm font-semibold text-white">
                {displayName.charAt(0).toUpperCase()}
              </span>
              <span className="max-w-[120px] truncate">{displayName}</span>
            </Link>
          ) : (
            <Link href="/auth/signin" className="inline-flex items-center gap-3 rounded-full border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-600 hover:bg-slate-800">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-200">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
