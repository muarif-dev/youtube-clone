"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface IUserProfile {
  _id: string;
  name: string;
  channelName?: string;
  image?: string;
}

interface IVideo {
  _id: string;
  id?: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  views: number;
  likes: number;
  type: "video" | "short";
  category: string;
  duration?: string;
  createdAt: string;
  userId?: IUserProfile;
  user?: IUserProfile;
  author?: string;
}

const categories = ["All", "Web Dev", "Gaming", "Music", "Tech", "Lifestyle"];

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

function HomeContent() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"all" | "video" | "short">("all");
  const searchParams = useSearchParams();

  useEffect(() => {
    const queryParam = searchParams.get("query") || "";
    const typeParam = searchParams.get("type");

    if (queryParam !== search) {
      setSearch(queryParam);
    }

    if (typeParam === "video" || typeParam === "short" || typeParam === "all") {
      setView(typeParam);
    }
  }, [searchParams, search]);

  useEffect(() => {
    async function fetchVideos() {
      try {
        const res = await fetch(`/api/videos`);
        const data = await res.json();
        const videoList = Array.isArray(data) ? data : data.videos || [];
        setVideos(videoList);
      } catch (err) {
        console.error("Error fetching videos:", err);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    }
    fetchVideos();
  }, []);

  const displayedVideos =
    selectedCategory === "All"
      ? videos
      : videos.filter((video) => video.category === selectedCategory);

  return (
    <main className="min-h-screen bg-[#0F0F0F] text-white pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="mb-6 px-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-white">Recommended</h1>
              <p className="mt-1 text-sm text-slate-400">Browse the latest uploads from creators you follow.</p>
            </div>
            <div className="rounded-full border border-neutral-800 bg-[#111111] px-3 py-2 text-sm text-slate-300">
              Showing {view === "short" ? "shorts" : view === "video" ? "videos" : "all uploads"}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`rounded-lg px-3 py-1 text-sm font-medium transition ${
                  selectedCategory === category ? "bg-[#272727] text-white" : "bg-[#1C1C1C] text-slate-300 hover:bg-[#272727]"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading videos...</div>
        ) : displayedVideos.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-xl font-semibold text-white">No {view === "short" ? "shorts" : "videos"} yet</p>
            <p className="mt-3 text-slate-500">Try a different search or upload the first {view === "short" ? "short" : "video"} to populate the feed.</p>
            <Link href="/upload" className="mt-6 inline-flex rounded-full bg-red-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-400">
              Start Uploading
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {displayedVideos.map((video) => {
              const channel = video.userId as IUserProfile;
              const displayName = channel?.channelName || channel?.name || "Creator";
              return (
                <Link
                  key={video._id}
                  href={`/watch/${video._id}`}
                  className="group overflow-hidden rounded-3xl bg-[#111111] transition hover:-translate-y-1"
                >
                  <div className="relative overflow-hidden">
                    <img src={video.thumbnailUrl} alt={video.title} className="aspect-video w-full object-cover rounded-t-3xl transition duration-300 group-hover:scale-105" />
                    <span className="absolute right-2 bottom-2 rounded-sm bg-black/80 px-2 py-1 text-[11px] font-semibold text-white">
                      {video.type === "short" ? "0:59" : "12:34"}
                    </span>
                  </div>
                  <div className="flex gap-3 p-4">
                    <img
                      src={channel?.image || `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundType=gradientLinear&colors=red,black,slate`}
                      alt="Channel avatar"
                      className="h-9 w-9 rounded-full bg-slate-700 object-cover"
                    />
                    <div className="min-w-0">
                      <h2 className="line-clamp-2 text-sm font-medium text-white">{video.title}</h2>
                      <p className="mt-2 text-xs text-slate-400">{displayName}</p>
                      <p className="mt-2 text-xs text-slate-500">{formatViews(video.views)} • {formatRelativeDate(video.createdAt)}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0F0F0F] p-12 text-center text-slate-400">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}