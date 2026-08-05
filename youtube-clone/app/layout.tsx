import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "./providers";
import { SidebarProvider } from "./components/SidebarProvider";
import AppHeader from "./components/AppHeader";
import Sidebar from "./components/Sidebar";
import BottomNav from "./components/BottomNav";
import { ToastProvider } from "./components/ToastProvider";
import { PlaylistProvider } from "./components/PlaylistProvider";
import ErrorBoundary from "./components/ErrorBoundary";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "YouTube Clone",
  description: "A YouTube clone built with Next.js, MongoDB, and Cloudinary",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={`${inter.className} bg-yt-bg text-white`}>
        <Providers>
          <SidebarProvider>
            <ToastProvider>
              <PlaylistProvider>
                <div className="flex min-h-screen flex-col">
                  <AppHeader />
                  <div className="flex flex-1">
                    <Sidebar />
                    <ErrorBoundary>
                      <main className="min-w-0 flex-1 pt-16 pb-16 md:pt-6 md:pb-0">{children}</main>
                    </ErrorBoundary>
                  </div>
                </div>
                <BottomNav />
              </PlaylistProvider>
            </ToastProvider>
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  );
}
