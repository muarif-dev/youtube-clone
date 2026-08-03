import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import Providers from "./providers";
import AppHeader from "./components/AppHeader";
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
        <Providers>
          <div className="min-h-screen">
            <AppHeader />

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

                <main>{children}</main>
              </div>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
