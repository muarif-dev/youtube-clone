"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  formatDuration,
  formatViews,
  formatRelativeDate,
  channelDisplayName,
  isShortContent,
} from "@/lib/video";
import VideoCardMenu from "./components/VideoCardMenu";
import { VideoGridSkeleton } from "./components/Skeletons";

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
  duration?: number | string;
  createdAt: string;
  userId?: IUserProfile;
  user?: IUserProfile;
  author?: string;
}

const categories = ["All", "Web Dev", "Gaming", "Music", "Tech", "Lifestyle"];

export default function Home() {
  const [videos, setVideos] = useState<IVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");

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

  const regularVideos = videos.filter((video) => !isShortContent(video));
  const displayedVideos =
    selectedCategory === "All"
      ? regularVideos
      : regularVideos.filter((video) => video.category === selectedCategory);

  return (
    <main className="min-h-screen bg-yt-bg pb-10 pt-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="mb-6 px-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-white">Recommended</h1>
              <p className="mt-1 text-sm text-yt-secondary">Browse the latest uploads from creators you follow.</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`rounded-lg px-3 py-1 text-sm font-medium transition ${
                  selectedCategory === category
                    ? "bg-white text-black"
                    : "bg-yt-hover text-[#F1F1F1] hover:bg-white/20"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        {loading ? (
          <VideoGridSkeleton count={8} />
        ) : displayedVideos.length === 0 ? (
          <div className="p-12 text-center text-yt-secondary">
            <p className="text-xl font-semibold text-white">No videos yet</p>
            <p className="mt-3 text-yt-secondary">Try a different category or upload the first video to populate the feed.</p>
            <Link href="/upload" className="mt-6 inline-flex rounded-full bg-yt-red px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#CC0000]">
              Start Uploading
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {displayedVideos.map((video) => {
              const channel = video.userId as IUserProfile;
              const displayName = channelDisplayName(channel);
              const duration = formatDuration(video.duration);
              return (
                <Link
                  key={video._id}
                  href={`/watch/${video._id}`}
                  className="group overflow-hidden rounded-xl bg-yt-card transition hover:bg-yt-hover"
                >
                  <div className="relative overflow-hidden">
                    <img src={video.thumbnailUrl} alt={video.title} className="aspect-video w-full object-cover transition duration-300 group-hover:scale-105" />
                    {duration && (
                      <span className="absolute right-2 bottom-2 rounded-sm bg-black/80 px-1.5 py-0.5 text-[11px] font-medium text-white">
                        {duration}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3 p-3">
                    <img
                      src={channel?.image || `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundType=gradientLinear&colors=red,black,slate`}
                      alt="Channel avatar"
                      className="h-9 w-9 rounded-full bg-yt-hover object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-1">
                        <h2 className="line-clamp-2 flex-1 text-sm font-medium text-white">{video.title}</h2>
                        <VideoCardMenu
                          video={{
                            _id: video._id,
                            title: video.title,
                            thumbnailUrl: video.thumbnailUrl,
                            videoUrl: video.videoUrl,
                          }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-yt-secondary">{displayName}</p>
                      <p className="mt-1 text-xs text-yt-secondary/80">{formatViews(video.views)} • {formatRelativeDate(video.createdAt)}</p>
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
