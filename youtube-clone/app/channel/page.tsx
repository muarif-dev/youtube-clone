"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import ProfileEditor from "../components/ProfileEditor";

interface IVideo {
  _id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  views: number;
  createdAt: string;
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

function formatViews(views: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", compactDisplay: "short" }).format(views);
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
  const [activeTab, setActiveTab] = useState("Home");
  const [videos, setVideos] = useState<IVideo[]>([]);
  const [profile, setProfile] = useState<IUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVideos() {
      if (status === "loading") {
        return;
      }
      if (!session) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
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
      } finally {
        setLoading(false);
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

  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900/80 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.9)]">
        <div className="relative h-52 bg-[radial-gradient(circle_at_top,_rgba(248,113,113,0.15),_transparent_60%),linear-gradient(180deg,_rgba(15,23,42,1),_rgba(15,23,42,0.7))]">
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent" />
        </div>
        <div className="space-y-6 p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-slate-950 bg-slate-800 shadow-lg shadow-black/40">
                <img
                  src={profile?.image || "https://api.dicebear.com/6.x/avataaars/svg?seed=channel-clone"}
                  alt="Channel avatar"
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-red-500">Official Channel</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">{profile?.channelName || profile?.name || "Your Channel"}</h1>
                <p className="mt-2 text-sm text-slate-400">{profile?.bio || "Creator on YouTube Clone"}</p>
              </div>
            </div>
            <div className="space-y-3 text-right">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Subscribers</p>
              <p className="text-2xl font-semibold text-white">{(profile?.subscribers || 0).toLocaleString()}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    activeTab === tab
                      ? "bg-red-500 text-white"
                      : "bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/20">
            {activeTab === "Home" && (
              <div className="space-y-4">
                <p className="text-lg font-semibold text-white">Channel Home</p>
                <p className="text-sm leading-6 text-slate-400">
                  Welcome to your channel. Share new uploads, update your bio, and grow your audience here.
                </p>
                <ProfileEditor />
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-3xl bg-slate-950/80 p-5 text-sm text-slate-300">
                    <p className="font-semibold text-white">Featured Playlist</p>
                    <p className="mt-3">Curated videos for creators and learners.</p>
                  </div>
                  <div className="rounded-3xl bg-slate-950/80 p-5 text-sm text-slate-300">
                    <p className="font-semibold text-white">Top Topic</p>
                    <p className="mt-3">Web development, system design, and modern workflows.</p>
                  </div>
                  <div className="rounded-3xl bg-slate-950/80 p-5 text-sm text-slate-300">
                    <p className="font-semibold text-white">Community</p>
                    <p className="mt-3">New uploads every week from creators using this clone app.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Videos" && (
              <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-white">Uploaded Videos</p>
                    <p className="text-sm text-slate-500">Latest uploads from your channel.</p>
                  </div>
                  <Link href="/upload" className="inline-flex rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700">
                    Upload New Video
                  </Link>
                </div>

                {status === "loading" ? (
                  <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/70 p-10 text-center text-slate-400">
                    Loading your channel...
                  </div>
                ) : !session ? (
                  <div className="rounded-3xl border border-slate-700 bg-slate-950/70 p-10 text-center text-slate-400">
                    Sign in to manage your videos.
                  </div>
                ) : error ? (
                  <div className="rounded-3xl border border-red-500 bg-slate-950/70 p-10 text-center text-red-300">
                    {error}
                  </div>
                ) : videos.length === 0 ? (
                  <div className="rounded-3xl border border-slate-700 bg-slate-950/70 p-10 text-center text-slate-400">
                    No channel videos available.
                  </div>
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {videos.map((video) => (
                      <article key={video._id} className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/95 transition hover:-translate-y-0.5">
                        <img src={video.thumbnailUrl} alt={video.title} className="h-44 w-full object-cover" />
                        <div className="p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <h2 className="line-clamp-2 text-base font-semibold text-white">{video.title}</h2>
                              <p className="mt-2 text-sm text-slate-400 line-clamp-2">{video.description}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDelete(video._id)}
                              className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-red-400"
                            >
                              Delete
                            </button>
                          </div>
                          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span>{formatViews(video.views)} views</span>
                            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-slate-600" />
                            <span>{formatRelativeDate(video.createdAt)}</span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "Playlists" && (
              <div className="space-y-4">
                <p className="text-lg font-semibold text-white">Playlists</p>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5">
                      <p className="font-semibold text-white">Playlist {index + 1}</p>
                      <p className="mt-3 text-sm text-slate-400">Curated set of videos for thematic learning.</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "About" && (
              <div className="space-y-4">
                <p className="text-lg font-semibold text-white">About</p>
                <p className="text-sm leading-7 text-slate-400">
                  {profile?.bio || "This channel is ready to share amazing content with viewers."}
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5">
                    <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Country</p>
                    <p className="mt-2 text-sm text-slate-300">Global</p>
                  </div>
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5">
                    <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Joined</p>
                    <p className="mt-2 text-sm text-slate-300">March 2026</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
