"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CirclePlay, Download, Heart, History, ListVideo, Trash2, X } from "lucide-react";
import { formatCount } from "@/lib/video";
import { usePlaylists } from "../components/PlaylistProvider";
import { useToast } from "../components/ToastProvider";
import type { PlaylistId, PlaylistEntry } from "@/lib/playlists";

interface ILibraryVideo {
  _id: string;
  title: string;
  thumbnailUrl: string;
  videoUrl: string;
  watchedAt: string;
}

interface ILikedVideo {
  _id: string;
  title: string;
  thumbnailUrl: string;
  videoUrl: string;
  likedAt?: string;
  watchedAt?: string;
}

const tabs = [
  { label: "History", icon: History },
  { label: "Downloads", icon: Download },
];

const PLAYLIST_META: Array<{ id: PlaylistId; name: string; color: string }> = [
  { id: "watchLater", name: "Watch Later", color: "#FF0000" },
  { id: "favorites", name: "My Favorites", color: "#3EA6FF" },
  { id: "musicMix", name: "Music Mix", color: "#FBC02D" },
];

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
  const [liked, setLiked] = useState<ILikedVideo[]>([]);
  const [loaded, setLoaded] = useState(false);
  const { ready, playlists, removeFromPlaylist } = usePlaylists();
  const showToast = useToast();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const timer = setTimeout(() => {
      const savedHistory = window.localStorage.getItem("watchHistory");
      const savedDownloads = window.localStorage.getItem("downloadedVideos");
      const savedLiked = window.localStorage.getItem("likedVideos");
      setHistory(savedHistory ? JSON.parse(savedHistory) : []);
      setDownloads(savedDownloads ? JSON.parse(savedDownloads) : []);
      setLiked(savedLiked ? JSON.parse(savedLiked) : []);
      setLoaded(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const items = activeTab === "History" ? history : downloads;

  const removeItem = async (entry: PlaylistEntry, playlistId: PlaylistId, playlistName: string) => {
    const ok = await removeFromPlaylist(entry._id, playlistId);
    showToast(ok ? `Removed from ${playlistName}` : "Failed to update playlist");
  };

  const clearPlaylist = async (playlistId: PlaylistId, playlistName: string, entries: PlaylistEntry[]) => {
    const results = await Promise.all(entries.map((entry) => removeFromPlaylist(entry._id, playlistId)));
    const ok = results.every(Boolean);
    showToast(ok ? `Cleared ${playlistName}` : "Failed to clear playlist");
  };

  return (
    <main className="min-h-screen bg-yt-bg px-4 pb-24 text-white sm:px-6 md:pb-10 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-yt-red">Library</p>
          <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Your Library</h1>
        </div>

        {/* Liked videos */}
        <section className="rounded-2xl border border-yt-border bg-yt-card p-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-yt-hover">
              <Heart className="h-5 w-5 text-white" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white">Liked Videos</h2>
              <p className="text-sm text-yt-secondary">
                {loaded ? `${formatCount(liked.length)} liked` : "Loading..."}
              </p>
            </div>
          </div>

          <div className="mt-5">
            {!loaded ? (
              <div className="rounded-2xl border border-yt-border bg-yt-bg p-10 text-center text-yt-secondary">
                Loading liked videos...
              </div>
            ) : liked.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-yt-border bg-yt-bg p-10 text-center text-yt-secondary">
                <Heart className="mx-auto mb-3 h-8 w-8" />
                <p className="font-medium text-white">No liked videos yet</p>
                <p className="mt-1 text-sm">Hit the like button on any video and it will show up here.</p>
                <Link
                  href="/"
                  className="mt-5 inline-flex rounded-full bg-yt-red px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#CC0000]"
                >
                  Find something to like
                </Link>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {liked.map((item) => (
                  <article key={item._id} className="group overflow-hidden rounded-2xl border border-yt-border bg-yt-bg transition hover:bg-yt-hover">
                    <Link href={`/watch/${item._id}`} className="block">
                      <div className="relative">
                        <img src={item.thumbnailUrl} alt={item.title} className="h-40 w-full object-cover" />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                          <CirclePlay className="h-10 w-10 text-white" />
                        </span>
                      </div>
                    </Link>
                    <div className="p-4">
                      <Link href={`/watch/${item._id}`} className="line-clamp-2 text-base font-semibold text-white hover:text-yt-red">
                        {item.title}
                      </Link>
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-yt-secondary">
                        <Heart className="h-3.5 w-3.5 text-yt-red" />
                        Liked {item.likedAt || item.watchedAt ? formatWatchedDate(item.likedAt || item.watchedAt || "") : "Recently"}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Playlists */}
        <section className="rounded-2xl border border-yt-border bg-yt-card p-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-yt-hover">
              <ListVideo className="h-5 w-5 text-white" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white">Playlists</h2>
              <p className="text-sm text-yt-secondary">Your saved collections</p>
            </div>
          </div>

          {!ready ? (
            <div className="mt-5 rounded-2xl border border-yt-border bg-yt-bg p-10 text-center text-yt-secondary">
              Loading playlists...
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {PLAYLIST_META.map(({ id, name, color }) => {
                const entries = playlists[id];
                const count = entries.length;
                const first = entries[0];
                return (
                  <div
                    key={id}
                    className="flex flex-col overflow-hidden rounded-2xl border border-yt-border bg-yt-bg"
                  >
                    <div className="relative h-24" style={{ background: color }}>
                      {entries.slice(0, 3).map((entry, index) => (
                        <img
                          key={entry._id}
                          src={entry.thumbnailUrl}
                          alt=""
                          className={`absolute inset-0 h-full object-cover ${index > 0 ? "opacity-50" : ""}`}
                          style={{ zIndex: 3 - index }}
                        />
                      ))}
                      <div className="absolute inset-0 bg-black/20" />
                      <span className="absolute right-3 bottom-3 rounded-sm bg-black/80 px-1.5 py-0.5 text-[11px] font-medium text-white">
                        {count} {count === 1 ? "video" : "videos"}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="text-base font-semibold text-white">{name}</h3>
                      <div className="mt-3 flex items-center gap-2">
                        {first ? (
                          <Link
                            href={`/watch/${first._id}`}
                            className="inline-flex items-center gap-1.5 rounded-full bg-yt-hover px-3.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/15"
                          >
                            <CirclePlay className="h-4 w-4" />
                            Play all
                          </Link>
                        ) : (
                          <span className="text-xs text-yt-secondary">Nothing saved yet</span>
                        )}
                        {count > 0 && (
                          <button
                            type="button"
                            onClick={() => clearPlaylist(id, name, entries)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-yt-hover px-3.5 py-1.5 text-xs font-medium text-yt-secondary transition hover:bg-white/15 hover:text-white"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Clear
                          </button>
                        )}
                      </div>
                      {count > 0 && (
                        <ul className="mt-3 space-y-1 border-t border-yt-border pt-2">
                          {entries.slice(0, 4).map((entry) => (
                            <li key={entry._id} className="group flex items-center gap-2">
                              <Link
                                href={`/watch/${entry._id}`}
                                className="line-clamp-1 min-w-0 flex-1 text-sm text-[#F1F1F1] transition hover:text-white"
                                title={entry.title}
                              >
                                {entry.title}
                              </Link>
                              <button
                                type="button"
                                onClick={() => removeItem(entry, id, name)}
                                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-yt-secondary transition hover:bg-white/15 hover:text-white"
                                aria-label={`Remove ${entry.title} from ${name}`}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </li>
                          ))}
                          {count > 4 && (
                            <li className="pt-1 text-xs text-yt-secondary">
                              +{count - 4} more videos
                            </li>
                          )}
                        </ul>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* History & Downloads */}
        <section className="rounded-2xl border border-yt-border bg-yt-card p-6">
          <div className="flex flex-wrap gap-3">
            {tabs.map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => setActiveTab(label)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeTab === label
                    ? "bg-white text-black"
                    : "bg-yt-hover text-[#F1F1F1] hover:bg-white/20"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            {!loaded ? (
              <div className="rounded-2xl border border-yt-border bg-yt-bg p-10 text-center text-yt-secondary">
                Loading library...
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-yt-border bg-yt-bg p-10 text-center text-yt-secondary">
                {activeTab === "History"
                  ? "Your watch history is empty. Watch a video to see it here."
                  : "No downloaded videos yet. Use the download button on a video to save it here."}
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                  <article key={item._id} className="overflow-hidden rounded-2xl border border-yt-border bg-yt-bg">
                    <Link href={`/watch/${item._id}`} className="block">
                      <img src={item.thumbnailUrl} alt={item.title} className="h-44 w-full object-cover" />
                    </Link>
                    <div className="p-4">
                      <Link href={`/watch/${item._id}`} className="line-clamp-2 text-lg font-semibold text-white hover:text-yt-red">
                        {item.title}
                      </Link>
                      <p className="mt-3 text-sm text-yt-secondary">{formatWatchedDate(item.watchedAt)}</p>
                      {activeTab === "Downloads" && (
                        <a
                          href={item.videoUrl}
                          download
                          className="mt-4 inline-flex items-center gap-2 rounded-full bg-yt-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#CC0000]"
                        >
                          <Download className="h-4 w-4" />
                          Download Again
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
