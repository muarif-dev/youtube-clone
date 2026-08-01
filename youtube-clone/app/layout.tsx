import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import Providers from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "YouTube Clone",
  description: "A YouTube clone built with Next.js, MongoDB, and Cloudinary",
};

const sidebarLinks = [
  { label: "Home", href: "/", icon: "M3 9.5L12 3l9 6.5V21a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-5H9v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" },
  { label: "Shorts", href: "/", icon: "M6 4l12 8-12 8V4z" },
  { label: "Subscriptions", href: "/subscriptions", icon: "M5 19h14V5H5v14zm7-12a3 3 0 100 6 3 3 0 000-6z" },
  { label: "Library", href: "/library", icon: "M4 6h4v14H4zm6 0h4v14h-4zm6 0h4v14h-4z" },
  { label: "My Channel", href: "/channel", icon: "M12 12a5 5 0 100-10 5 5 0 000 10zm-7 9a7 7 0 0114 0H5z" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-950 text-slate-100`}>
        <div className="min-h-screen">
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
                <Link href="/auth/signin" className="inline-flex items-center gap-3 rounded-full border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-600 hover:bg-slate-800">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-200">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <span>Sign In</span>
                </Link>
              </div>
            </div>
          </header>

          <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
            <aside className="hidden w-72 shrink-0 rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl shadow-slate-950/20 lg:block">
              <nav className="space-y-2">
                {sidebarLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-800 hover:text-white"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-red-500" fill="currentColor" aria-hidden="true">
                      <path d={item.icon} />
                    </svg>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </aside>

            <div className="flex-1">
              <details className="mb-4 rounded-3xl border border-slate-800 bg-slate-900/95 p-4 shadow-xl shadow-slate-950/10 lg:hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-slate-100">
                  <span>Menu</span>
                  <span className="rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-xs text-slate-400">Open</span>
                </summary>
                <nav className="mt-4 space-y-2">
                  {sidebarLinks.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-800 hover:text-white"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <Link
                    href="/upload"
                    className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-800 hover:text-white"
                  >
                    Upload
                  </Link>
                </nav>
              </details>

              <main>
                <Providers>{children}</Providers>
              </main>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
