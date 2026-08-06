"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Upload,
  Trash2,
  Pencil,
  Play,
  Clapperboard,
  Clock,
  Heart,
  Music,
} from "lucide-react";
import ProfileEditor from "../components/ProfileEditor";
import { usePlaylists, type PlaylistsMap } from "../components/PlaylistProvider";
import { formatDuration, viewCount } from "@/lib/video";
import { ChannelHeaderSkeleton, VideoGridSkeleton } from "../components/Skeletons";
import type { PlaylistId } from "@/lib/playlists";

interface IVideo {
  _id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  views: number;
  createdAt: string;
  duration?: number | string;
}

interface IUserProfile {
  _id: string;
  name: string;
  channelName?: string;
  image?: string;
  bio?: string;
  subscribers?: number;
}

const tabs = ["Home", "Videos", "Playlists", "About"];

const playlistConfig: { id: PlaylistId; label: string; icon: typeof Clock }[] = [
  { id: "watchLater", label: "Watch Later", icon: Clock },
  { id: "favorites", label: "Favorites", icon: Heart },
  { id: "musicMix", label: "Music Mix", icon: Music },
];

function formatCount(count: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", compactDisplay: "short" }).format(count);
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

export default function ChannelPage() {
  const { data: session, status } = useSession();
  const { playlists } = usePlaylists();
  const [activeTab, setActiveTab] = useState("Home");
  const [videos, setVideos] = useState<IVideo[]>([]);
  const [profile, setProfile] = useState<IUserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVideos() {
      if (status === "loading") {
        return;
      }
      if (!session) {
        return;
      }
      try {
        const res = await fetch("/api/videos/user");
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          setVideos(data);
        } else {
          setError(data.error || "Unable to fetch your videos.");
        }
      } catch (err) {
        console.error("Error fetching videos:", err);
        setError("Unable to fetch your videos.");
      }
    }
    fetchVideos();
  }, [session, status]);

  useEffect(() => {
    async function loadProfile() {
      if (!session?.user?.id) return;
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        if (res.ok) {
          setProfile(data);
        }
      } catch (err) {
        console.error("Unable to load profile:", err);
      }
    }
    loadProfile();
  }, [session]);

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Delete this video? This action cannot be undone.");
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/videos/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Unable to delete the video.");
        return;
      }

      setVideos((current) => current.filter((video) => video._id !== id));
    } catch (err) {
      console.error(err);
      alert("Unable to delete the video.");
    }
  };

  const handleProfileUpdate = (updates: Partial<IUserProfile>) => {
    setProfile((current) => (current ? { ...current, ...updates } : current));
  };

  const renderPlaylistCards = (store: PlaylistsMap) => (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {playlistConfig.map(({ id, label, icon: Icon }) => {
        const entries = store[id];
        return (
          <Link
            key={id}
            href="/library"
            className="group overflow-hidden rounded-2xl border border-yt-border bg-yt-bg transition hover:border-yt-hover hover:bg-yt-hover"
          >
            <div className="relative grid aspect-video grid-cols-3 gap-1 bg-yt-hover p-1">
              {entries.length === 0 ? (
                <div className="col-span-3 flex flex-col items-center justify-center gap-2 text-yt-secondary">
                  <Icon className="h-8 w-8" />
                  <span className="text-xs">No videos saved</span>
                </div>
              ) : (
                entries.slice(0, 3).map((entry) => (
                  <div key={entry._id} className="relative h-full w-full overflow-hidden">
                    {entry.thumbnailUrl ? (
                      <img src={entry.thumbnailUrl} alt={entry.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-yt-hover">
                        <Play className="h-4 w-4 text-yt-secondary" />
                      </div>
                    )}
                  </div>
                ))
              )}
              <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded bg-black/80 px-2 py-0.5 text-[11px] font-medium text-white">
                <Play className="h-3 w-3" />
                {entries.length}
              </span>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-white">{label}</h3>
              <p className="mt-1 text-sm text-yt-secondary">
                {entries.length === 0
                  ? "Empty playlist"
                  : entries.length === 1
                    ? "1 video"
                    : `${entries.length} videos`}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );

  return (
    <main className="min-h-screen bg-yt-bg px-4 pb-24 text-white sm:px-6 md:pb-10 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {!profile && status === "authenticated" ? (
          <ChannelHeaderSkeleton />
        ) : (
          <div className="relative overflow-hidden rounded-2xl border border-yt-border bg-yt-card">
            <div className="relative h-40 bg-[radial-gradient(circle_at_top,_rgba(255,0,0,0.18),_transparent_60%),linear-gradient(180deg,#212121,#0f0f0f)]">
              <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-yt-bg/95 via-yt-bg/40 to-transparent" />
            </div>

            <div className="space-y-6 p-6 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-yt-card bg-yt-hover">
                    <img
                      src={profile?.image || "https://api.dicebear.com/6.x/avataaars/svg?seed=channel-clone"}
                      alt="Channel avatar"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-yt-red">Official Channel</p>
                    <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                      {profile?.channelName || profile?.name || "Your Channel"}
                    </h1>
                    <p className="mt-1 text-sm text-yt-secondary">{profile?.bio || "Creator on YouTube Clone"}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 sm:items-end">
                  <div className="text-left sm:text-right">
                    <p className="text-xs uppercase tracking-[0.25em] text-yt-secondary">Subscribers</p>
                    <p className="mt-1 text-2xl font-semibold text-white">
                      {formatCount(profile?.subscribers || 0)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("Home")}
                      className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/85"
                    >
                      <Pencil className="h-4 w-4" />
                      Customize Channel
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("Videos")}
                      className="inline-flex items-center gap-2 rounded-full bg-yt-hover px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                    >
                      <Clapperboard className="h-4 w-4" />
                      Manage Videos
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      activeTab === tab
                        ? "bg-white text-black"
                        : "bg-yt-hover text-[#F1F1F1] hover:bg-white/20"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {activeTab === "Home" && (
                <div className="space-y-6">
                  <p className="text-lg font-semibold text-white">Channel Home</p>
                  <p className="text-sm leading-6 text-yt-secondary">
                    Welcome to your channel. Share new uploads, update your bio, and grow your audience here.
                  </p>
                  <ProfileEditor profile={profile} onUpdate={handleProfileUpdate} onSaved={handleProfileUpdate} />
                </div>
              )}

              {activeTab === "Videos" && (
                <div className="space-y-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-white">Uploaded Videos</p>
                      <p className="text-sm text-yt-secondary">Latest uploads from your channel.</p>
                    </div>
                    <Link
                      href="/upload"
                      className="inline-flex items-center gap-2 rounded-full bg-yt-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#CC0000]"
                    >
                      <Upload className="h-4 w-4" />
                      Upload New Video
                    </Link>
                  </div>

                  {status === "loading" ? (
                    <VideoGridSkeleton count={6} />
                  ) : !session ? (
                    <div className="rounded-2xl border border-yt-border bg-yt-card p-10 text-center text-yt-secondary">
                      Sign in to manage your videos.
                    </div>
                  ) : error ? (
                    <div className="rounded-2xl border border-yt-red bg-yt-card p-10 text-center text-red-300">
                      {error}
                    </div>
                  ) : videos.length === 0 ? (
                    <div className="rounded-2xl border border-yt-border bg-yt-card p-10 text-center text-yt-secondary">
                      No channel videos available.
                    </div>
                  ) : (
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                      {videos.map((video) => {
                        const duration = formatDuration(video.duration);
                        return (
                          <article
                            key={video._id}
                            className="group overflow-hidden rounded-2xl border border-yt-border bg-yt-bg transition hover:bg-yt-hover"
                          >
                            <Link
                              href={`/watch/${video._id}`}
                              className="relative block aspect-video w-full overflow-hidden bg-yt-hover"
                            >
                              <img
                                src={video.thumbnailUrl}
                                alt={video.title}
                                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                              />
                              {duration ? (
                                <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
                                  {duration}
                                </span>
                              ) : null}
                            </Link>
                            <div className="p-4">
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <Link href={`/watch/${video._id}`}>
                                    <h2 className="line-clamp-2 text-base font-semibold text-white group-hover:text-white">
                                      {video.title}
                                    </h2>
                                  </Link>
                                  <p className="mt-1 text-sm text-yt-secondary line-clamp-2">{video.description}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(video._id)}
                                  className="inline-flex shrink-0 items-center gap-1 rounded-full bg-yt-hover px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-yt-red"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete
                                </button>
                              </div>
                              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-yt-secondary">
                                <span>{formatCount(viewCount(video.views))} views</span>
                                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-yt-border" />
                                <span>{formatRelativeDate(video.createdAt)}</span>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "Playlists" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold text-white">Playlists</p>
                      <p className="text-sm text-yt-secondary">Your saved collections.</p>
                    </div>
                    <Link href="/library" className="text-sm font-medium text-yt-red hover:text-red-300">
                      View Library
                    </Link>
                  </div>
                  {renderPlaylistCards(playlists)}
                </div>
              )}

              {activeTab === "About" && (
                <div className="space-y-4">
                  <p className="text-lg font-semibold text-white">About</p>
                  <p className="text-sm leading-7 text-yt-secondary">
                    {profile?.bio || "This channel is ready to share amazing content with viewers."}
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-yt-border bg-yt-bg p-5">
                      <p className="text-xs uppercase tracking-[0.3em] text-yt-secondary">Country</p>
                      <p className="mt-2 text-sm text-white">Global</p>
                    </div>
                    <div className="rounded-2xl border border-yt-border bg-yt-bg p-5">
                      <p className="text-xs uppercase tracking-[0.3em] text-yt-secondary">Joined</p>
                      <p className="mt-2 text-sm text-white">March 2026</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
