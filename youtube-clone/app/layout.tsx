import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "./providers";
import AppHeader from "./components/AppHeader";
import Sidebar from "./components/Sidebar";
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
      <body suppressHydrationWarning className={`${inter.className} bg-[#0F0F0F] text-white`}>
        <Providers>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1">
              <AppHeader />
              <main>{children}</main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
