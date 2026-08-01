"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface ILibraryVideo {
  _id: string;
  title: string;
  thumbnailUrl: string;
  videoUrl: string;
  watchedAt: string;
}

const tabs = ["History", "Downloads"];

function formatWatchedDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState("History");
  const [history, setHistory] = useState<ILibraryVideo[]>([]);
  const [downloads, setDownloads] = useState<ILibraryVideo[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const savedHistory = typeof window !== "undefined" ? window.localStorage.getItem("watchHistory") : null;
    const savedDownloads = typeof window !== "undefined" ? window.localStorage.getItem("downloadedVideos") : null;
    setHistory(savedHistory ? JSON.parse(savedHistory) : []);
    setDownloads(savedDownloads ? JSON.parse(savedDownloads) : []);
    setLoaded(true);
  }, []);

  const items = activeTab === "History" ? history : downloads;

  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 pb-10 pt-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-red-500">Library</p>
            <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Watch History & Downloads</h1>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/20">
          <div className="flex flex-wrap gap-3">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab ? "bg-red-500 text-white" : "bg-slate-950 text-slate-300 hover:bg-slate-900 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            {!loaded ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-10 text-center text-slate-400">Loading library...</div>
            ) : items.length === 0 ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-10 text-center text-slate-400">
                {activeTab === "History"
                  ? "Your watch history is empty. Watch a video to see it here."
                  : "No downloaded videos yet. Use the download button on a video to save it here."}
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                  <article key={item._id} className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/95 shadow-sm">
                    <Link href={`/watch/${item._id}`} className="block">
                      <img src={item.thumbnailUrl} alt={item.title} className="h-44 w-full object-cover" />
                    </Link>
                    <div className="p-4">
                      <Link href={`/watch/${item._id}`} className="text-lg font-semibold text-white line-clamp-2 hover:text-red-500">
                        {item.title}
                      </Link>
                      <p className="mt-3 text-sm text-slate-400">{formatWatchedDate(item.watchedAt)}</p>
                      {activeTab === "Downloads" && (
                        <a
                          href={item.videoUrl}
                          download
                          className="mt-4 inline-flex rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-400"
                        >
                          Download Again
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
