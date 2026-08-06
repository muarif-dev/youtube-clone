"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CirclePlay, Search, SlidersHorizontal, SquarePlay } from "lucide-react";
import { SearchResultsSkeleton } from "../components/Skeletons";
import {
  formatDuration,
  formatViews,
  formatRelativeDate,
  channelDisplayName,
  isShortContent,
} from "@/lib/video";

interface IUserProfile {
  _id: string;
  name: string;
  channelName?: string;
  image?: string;
  subscribers?: number;
}

interface IVideo {
  _id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  views: number;
  type: "video" | "short";
  duration?: number | string;
  createdAt: string;
  userId?: IUserProfile;
}

const UPLOAD_DATE_OPTIONS = [
  { value: "any", label: "Any time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this week", label: "This week" },
  { value: "this month", label: "This month" },
  { value: "this year", label: "This year" },
];

const DURATION_OPTIONS = [
  { value: "any", label: "Any duration" },
  { value: "short", label: "Under 3 minutes" },
  { value: "medium", label: "4-20 minutes" },
  { value: "long", label: "Over 20 minutes" },
];

const TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  { value: "video", label: "Video" },
  { value: "short", label: "Short" },
];

export default function SearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";

  const [videos, setVideos] = useState<IVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [uploadDate, setUploadDate] = useState("any");
  const [duration, setDuration] = useState("any");
  const [type, setType] = useState("all");

  useEffect(() => {
    if (!query) return;
    let cancelled = false;
    async function fetchResults() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: query });
        if (uploadDate !== "any") params.set("uploadDate", uploadDate);
        if (duration !== "any") params.set("duration", duration);
        if (type !== "all") params.set("type", type);
        const res = await fetch(`/api/search?${params.toString()}`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.videos || [];
        if (!cancelled) setVideos(list);
      } catch (err) {
        console.error("Error searching videos:", err);
        if (!cancelled) setVideos([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchResults();
    return () => {
      cancelled = true;
    };
  }, [query, uploadDate, duration, type]);

  const regularVideos = videos.filter((video) => !isShortContent(video));
  const shortVideos = videos.filter((video) => isShortContent(video));

  if (!query) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-yt-bg px-4 pt-20 pb-24 text-white md:pb-10">
        <Search className="h-12 w-12 text-yt-secondary" />
        <h1 className="text-xl font-semibold text-white">Search YouTube</h1>
        <p className="text-sm text-yt-secondary">Type in the search bar above to find videos and shorts.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-yt-bg px-4 pb-24 text-white sm:px-6 md:pb-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-lg font-medium text-white">
            Search results for &ldquo;<span className="text-yt-secondary">{query}</span>&rdquo;
          </h1>
          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            className="inline-flex items-center gap-2 rounded-full border border-yt-border bg-yt-card px-4 py-2 text-sm font-medium text-white transition hover:bg-yt-hover"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </button>
        </div>

        {filtersOpen && (
          <div className="mt-4 flex flex-wrap gap-3 rounded-xl border border-yt-border bg-yt-card p-4">
            <label className="flex flex-col gap-1.5 text-xs font-medium text-yt-secondary">
              Upload date
              <select
                value={uploadDate}
                onChange={(event) => setUploadDate(event.target.value)}
                className="rounded-lg border border-[#5a5a5a] bg-[#121212] px-3 py-2 text-sm text-white focus:border-yt-red focus:outline-none"
              >
                {UPLOAD_DATE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-medium text-yt-secondary">
              Duration
              <select
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
                className="rounded-lg border border-[#5a5a5a] bg-[#121212] px-3 py-2 text-sm text-white focus:border-yt-red focus:outline-none"
              >
                {DURATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-medium text-yt-secondary">
              Type
              <select
                value={type}
                onChange={(event) => setType(event.target.value)}
                className="rounded-lg border border-[#5a5a5a] bg-[#121212] px-3 py-2 text-sm text-white focus:border-yt-red focus:outline-none"
              >
                {TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {loading ? (
          <SearchResultsSkeleton />
        ) : videos.length === 0 ? (
          <div className="py-16 text-center">
            <Search className="mx-auto mb-4 h-12 w-12 text-yt-secondary" />
            <p className="text-lg font-semibold text-white">No results for &ldquo;{query}&rdquo;</p>
            <p className="mt-2 text-sm text-yt-secondary">Check your spelling, clear your filters, or try a different keyword.</p>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-6 inline-flex rounded-full bg-yt-red px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#CC0000]"
            >
              Browse Recommended
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-10">
            {regularVideos.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-base font-medium text-white">Videos</h2>
                {regularVideos.map((video) => {
                  const channel = video.userId as IUserProfile;
                  const displayName = channelDisplayName(channel);
                  const duration = formatDuration(video.duration);
                  return (
                    <div
                      key={video._id}
                      className="group flex gap-3 rounded-xl bg-yt-card p-3 transition hover:bg-yt-hover sm:gap-4"
                    >
                      <Link href={`/watch/${video._id}`} className="relative block shrink-0">
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="aspect-video w-44 rounded-lg object-cover transition duration-300 group-hover:scale-105 sm:w-60 md:w-80"
                        />
                        {duration && (
                          <span className="absolute right-1.5 bottom-1.5 rounded-sm bg-black/80 px-1.5 py-0.5 text-[11px] font-medium text-white">
                            {duration}
                          </span>
                        )}
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link href={`/watch/${video._id}`}>
                          <h3 className="line-clamp-2 text-base font-medium text-white transition group-hover:text-yt-red">
                            {video.title}
                          </h3>
                        </Link>
                        <p className="mt-1 text-xs text-yt-secondary">
                          {formatViews(video.views)} • {formatRelativeDate(video.createdAt)}
                        </p>
                        <Link
                          href={`/channel/${channel?._id}`}
                          className="mt-2 flex items-center gap-1.5"
                        >
                          <img
                            src={
                              channel?.image ||
                              `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundType=gradientLinear&colors=red,black,slate`
                            }
                            alt={displayName}
                            className="h-5 w-5 rounded-full bg-yt-hover object-cover transition hover:opacity-80"
                          />
                          <span className="text-xs text-yt-secondary transition hover:text-white">{displayName}</span>
                        </Link>
                        {video.description && (
                          <p className="mt-2 hidden line-clamp-2 text-xs text-yt-secondary/80 sm:block">
                            {video.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </section>
            )}

            {shortVideos.length > 0 && (
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <SquarePlay className="h-5 w-5 text-white" />
                  <h2 className="text-base font-medium text-white">Shorts</h2>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
                  {shortVideos.map((short) => {
                    const channel = short.userId as IUserProfile;
                    const displayName = channelDisplayName(channel);
                    const duration = formatDuration(short.duration);
                    return (
                      <Link
                        key={short._id}
                        href={`/watch/${short._id}`}
                        className="group overflow-hidden rounded-xl bg-yt-card transition hover:bg-yt-hover"
                      >
                        <div className="relative overflow-hidden">
                          <img
                            src={short.thumbnailUrl}
                            alt={short.title}
                            className="aspect-[9/16] w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                          <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-sm bg-black/80 px-1.5 py-0.5 text-[11px] font-medium text-white">
                            <CirclePlay className="h-3.5 w-3.5" />
                            {duration || "Short"}
                          </span>
                        </div>
                        <div className="p-3">
                          <h3 className="line-clamp-2 text-sm font-medium text-white">{short.title}</h3>
                          <p className="mt-1 text-xs text-yt-secondary">{displayName}</p>
                          <p className="mt-1 text-xs text-yt-secondary/80">{formatViews(short.views)}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
