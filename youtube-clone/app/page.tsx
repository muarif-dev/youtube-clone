"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

interface IVideo {
  _id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  views: number;
  createdAt: string;
}

const categories = ["All", "Computer Science", "Web Dev", "Gaming", "Music", "Live"];

function formatViews(views: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", compactDisplay: "short" }).format(views) + " views";
}

function formatRelativeDate(createdAt: string) {
  const diff = Date.now() - new Date(createdAt).getTime();
  const day = 1000 * 60 * 60 * 24;
  if (diff < day) return "Today";
  if (diff < day * 7) return `${Math.floor(diff / day)} days ago`;
  if (diff < day * 30) return `${Math.floor(diff / day / 7)} weeks ago`;
  if (diff < day * 365) return `${Math.floor(diff / day / 30)} months ago`;
  return `${Math.floor(diff / day / 365)} years ago`;
}

export default function Home() {
  const [videos, setVideos] = useState<IVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    async function fetchVideos() {
      try {
        const res = await fetch("/api/videos");
        const data = await res.json();
        if (Array.isArray(data)) {
          setVideos(data);
        }
      } catch (err) {
        console.error("Error fetching videos:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchVideos();
  }, []);

  const activeLabel = useMemo(() => {
    return activeCategory === "All" ? "Trending" : activeCategory;
  }, [activeCategory]);

  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <section className="mb-8 rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.9)] backdrop-blur-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-500">Featured</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Explore the latest videos in {activeLabel}
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-slate-400 sm:text-base">
              Discover top uploads from creators, curated categories, and fresh ideas for your next watch.
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                activeCategory === category
                  ? "border-red-500 bg-red-500/10 text-white"
                  : "border-slate-700 bg-slate-950/70 text-slate-300 hover:border-slate-500 hover:bg-slate-900/80 hover:text-white"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="rounded-[2rem] border border-dashed border-slate-700 bg-slate-900/90 p-12 text-center text-slate-400 shadow-inner shadow-slate-950/20">
          Loading videos...
        </div>
      ) : videos.length === 0 ? (
        <div className="rounded-[2rem] border border-slate-700 bg-slate-900/90 p-12 text-center text-slate-400 shadow-inner shadow-slate-950/20">
          <p className="text-xl font-semibold text-white">No videos available yet</p>
          <p className="mt-3 text-slate-500">Upload your first video to populate the feed.</p>
          <Link
            href="/upload"
            className="mt-6 inline-flex rounded-full bg-red-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-400"
          >
            Start Uploading
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {videos.map((video) => (
            <Link
              key={video._id}
              href={`/watch/${video._id}`}
              className="group overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900 shadow-[0_10px_30px_-15px_rgba(15,23,42,0.8)] transition hover:-translate-y-1 hover:border-red-500/40"
            >
              <div className="relative overflow-hidden bg-slate-800">
                <img src={video.thumbnailUrl} alt={video.title} className="h-56 w-full object-cover transition duration-300 group-hover:scale-105" />
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/25 opacity-0 transition group-hover:opacity-100">
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-500/95 text-white shadow-lg">
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </div>
                <span className="absolute right-4 top-4 rounded-full bg-slate-950/90 px-3 py-1 text-xs font-semibold text-slate-100">
                  {formatViews(video.views)}
                </span>
              </div>
              <div className="space-y-4 p-6">
                <div className="flex items-start gap-3">
                  <img
                    src={`https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(video.title)}&backgroundType=gradientLinear&colors=red,black,slate`}
                    alt="Channel avatar"
                    className="h-12 w-12 rounded-full bg-slate-700 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="line-clamp-2 text-lg font-semibold text-white">{video.title}</h2>
                    <p className="mt-2 text-sm text-slate-400 line-clamp-2">{video.description}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <span>{formatRelativeDate(video.createdAt)}</span>
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-slate-500" />
                  <span className="text-slate-400">YouTube Clone Channel</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
