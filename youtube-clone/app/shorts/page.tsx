"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SquarePlay, Upload } from "lucide-react";
import UploadModal from "../components/UploadModal";
import { formatDuration, formatViews, isShortContent, channelDisplayName } from "@/lib/video";

interface IUserProfile {
  _id: string;
  name: string;
  channelName?: string;
  image?: string;
}

interface IShort {
  _id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl: string;
  views: number;
  likes: number;
  createdAt: string;
  type?: "video" | "short";
  duration?: number | string;
  userId?: IUserProfile;
}

export default function ShortsPage() {
  const [shorts, setShorts] = useState<IShort[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    async function fetchShorts() {
      try {
        const res = await fetch(`/api/videos?type=short`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.videos || [];
        setShorts(list.filter((short: IShort) => isShortContent(short)));
      } catch (err) {
        console.error("Error fetching shorts:", err);
        setShorts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchShorts();
  }, []);

  return (
    <main className="min-h-screen bg-yt-bg px-4 pt-6 pb-24 text-white sm:px-6 md:pb-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-yt-card text-white">
              <SquarePlay className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-semibold text-white">Shorts</h1>
              <p className="mt-1 text-sm text-yt-secondary">Bite-sized vertical videos from the community.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-yt-red px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#CC0000]"
          >
            <Upload className="h-5 w-5" />
            Upload Short
          </button>
        </section>

        {loading ? (
          <div className="p-12 text-center text-yt-secondary">Loading shorts...</div>
        ) : shorts.length === 0 ? (
          <div className="mx-auto max-w-md py-16 text-center">
            <div className="mx-auto mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-yt-card">
              <SquarePlay className="h-12 w-12 text-yt-secondary" />
            </div>
            <h2 className="text-2xl font-semibold text-white">No Shorts available yet</h2>
            <p className="mt-3 text-yt-secondary">
              Vertical videos under 60 seconds live here. Be the first to share a short with the community.
            </p>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-yt-red px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#CC0000]"
            >
              <Upload className="h-5 w-5" />
              Upload Short
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {shorts.map((short) => {
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
                    {duration ? (
                      <span className="absolute right-2 bottom-2 rounded-sm bg-black/80 px-2 py-1 text-[11px] font-semibold text-white">
                        {duration}
                      </span>
                    ) : (
                      <span className="absolute right-2 bottom-2 rounded-sm bg-black/80 px-2 py-1 text-[11px] font-semibold text-white">
                        Short
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <h2 className="line-clamp-2 text-sm font-medium text-white">{short.title}</h2>
                    <p className="mt-1 text-xs text-yt-secondary">{displayName}</p>
                    <p className="mt-1 text-xs text-yt-secondary/80">{formatViews(short.views)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <UploadModal open={modalOpen} onClose={() => setModalOpen(false)} type="short" />
    </main>
  );
}
