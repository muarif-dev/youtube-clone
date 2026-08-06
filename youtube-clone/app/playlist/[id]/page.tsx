"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ChevronLeft, CirclePlay, ListVideo, Trash2, X } from "lucide-react";
import { useToast } from "../../components/ToastProvider";
import { formatCount } from "@/lib/video";

function PlaylistPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-40 animate-pulse rounded-full bg-yt-card" />
      <div className="rounded-2xl border border-yt-border bg-yt-card p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="h-14 w-14 animate-pulse rounded-2xl bg-yt-hover" />
          <div className="flex-1 space-y-2">
            <div className="h-6 w-1/2 animate-pulse rounded bg-yt-hover" />
            <div className="h-3 w-1/4 animate-pulse rounded bg-yt-hover" />
          </div>
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-2xl border border-yt-border bg-yt-card">
            <div className="h-40 animate-pulse bg-yt-hover" />
            <div className="space-y-2 p-4">
              <div className="h-4 w-4/5 animate-pulse rounded bg-yt-hover" />
              <div className="h-4 w-3/5 animate-pulse rounded bg-yt-hover" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface IPlaylistVideo {
  _id: string;
  title: string;
  thumbnailUrl: string;
  videoUrl: string;
}

interface IPlaylist {
  _id: string;
  name: string;
  videos: string[];
  isPrivate: boolean;
  count: number;
  entries: IPlaylistVideo[];
}

export default function PlaylistDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const { status } = useSession();
  const showToast = useToast();

  const [playlist, setPlaylist] = useState<IPlaylist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    if (status === "loading" || status !== "authenticated") return;

    let cancelled = false;

    async function fetchPlaylist() {
      try {
        const res = await fetch(`/api/playlists/${id}`, { credentials: "same-origin" });
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 404 || data?.error === "Playlist not found") {
            if (!cancelled) setNotFound(true);
          } else {
            if (!cancelled) setError(data?.error || "Unable to load this playlist.");
          }
          return;
        }
        const loaded = data?.playlist || null;
        if (!cancelled) {
          if (loaded) setPlaylist(loaded);
          else setNotFound(true);
        }
      } catch {
        if (!cancelled) setError("Unable to load this playlist.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPlaylist();
    return () => {
      cancelled = true;
    };
  }, [id, status]);

  const unauthenticated = status === "unauthenticated";
  const entries = playlist?.entries || [];
  const count = typeof playlist?.count === "number" ? playlist.count : entries.length;
  const firstEntry = entries[0];

  const removeVideo = async (videoId: string) => {
    if (!playlist || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/playlists/${playlist._id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, checked: false }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data?.error || "Failed to remove video");
        return;
      }
      setPlaylist(data?.playlist || null);
      showToast("Removed from playlist");
    } catch {
      showToast("Failed to remove video");
    } finally {
      setBusy(false);
    }
  };

  const deletePlaylist = async () => {
    if (!playlist || busy) return;
    if (!window.confirm(`Delete "${playlist.name}"? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/playlists/${playlist._id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!res.ok) {
        const data = await res.json();
        showToast(data?.error || "Failed to delete playlist");
        return;
      }
      showToast("Playlist deleted");
      router.push("/library");
    } catch {
      showToast("Failed to delete playlist");
    } finally {
      setBusy(false);
    }
  };

  const notFoundState = Boolean(
    !id || notFound || (!loading && !error && !unauthenticated && !playlist)
  );

  return (
    <main className="min-h-screen bg-yt-bg px-4 pb-24 text-white sm:px-6 md:pb-10 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/library"
            className="inline-flex items-center gap-2 rounded-full border border-yt-border bg-yt-card px-4 py-2 text-sm font-medium text-white transition hover:bg-yt-hover"
          >
            <ChevronLeft className="h-4 w-4 text-yt-red" />
            Library
          </Link>
          {playlist && (
            <button
              type="button"
              onClick={deletePlaylist}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-yt-hover px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete playlist
            </button>
          )}
        </div>

        {unauthenticated ? (
          <div className="rounded-2xl border border-yt-red bg-yt-card p-12 text-center">
            <p className="text-lg font-semibold text-red-300">Please sign in to view your library and playlists.</p>
            <Link
              href="/auth/signin"
              className="mt-5 inline-flex rounded-full bg-yt-red px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#CC0000]"
            >
              Sign in
            </Link>
          </div>
        ) : notFoundState ? (
          <div className="rounded-2xl border border-dashed border-yt-border bg-yt-card p-12 text-center text-yt-secondary">
            <ListVideo className="mx-auto mb-3 h-10 w-10" />
            <p className="text-xl font-semibold text-white">Playlist Not Found</p>
            <p className="mt-2 text-sm">This playlist does not exist or has been deleted.</p>
            <Link
              href="/library"
              className="mt-6 inline-flex rounded-full bg-yt-red px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#CC0000]"
            >
              Back to Library
            </Link>
          </div>
        ) : loading ? (
          <PlaylistPageSkeleton />
        ) : error ? (
          <div className="rounded-2xl border border-yt-red bg-yt-card p-12 text-center">
            <p className="text-lg font-semibold text-red-300">{error}</p>
            <Link
              href="/library"
              className="mt-5 inline-flex rounded-full bg-yt-red px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#CC0000]"
            >
              Back to Library
            </Link>
          </div>
        ) : playlist ? (
          <>
            <section className="rounded-2xl border border-yt-border bg-yt-card p-6">
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-yt-hover">
                  <ListVideo className="h-7 w-7 text-white" />
                </span>
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl font-semibold text-white sm:text-3xl">{playlist.name}</h1>
                  <p className="mt-1 text-sm text-yt-secondary">
                    {formatCount(count ?? 0)} {count === 1 ? "video" : "videos"}
                  </p>
                </div>
                {firstEntry && (
                  <Link
                    href={`/watch/${firstEntry._id}`}
                    className="inline-flex items-center gap-2 rounded-full bg-yt-red px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#CC0000]"
                  >
                    <CirclePlay className="h-5 w-5" />
                    Play all
                  </Link>
                )}
              </div>
            </section>

            {entries.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-yt-border bg-yt-card p-12 text-center text-yt-secondary">
                <ListVideo className="mx-auto mb-3 h-8 w-8" />
                <p className="font-medium text-white">This playlist is empty</p>
                <p className="mt-1 text-sm">Save videos to this playlist to see them here.</p>
                <Link
                  href="/"
                  className="mt-5 inline-flex rounded-full bg-yt-red px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#CC0000]"
                >
                  Browse videos
                </Link>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {(entries || []).map((entry) => (
                  <article
                    key={entry._id}
                    className="group overflow-hidden rounded-2xl border border-yt-border bg-yt-card transition hover:bg-yt-hover"
                  >
                    <Link href={`/watch/${entry._id}`} className="block">
                      <div className="relative">
                        <img src={entry.thumbnailUrl} alt={entry.title} className="h-40 w-full object-cover" />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                          <CirclePlay className="h-10 w-10 text-white" />
                        </span>
                      </div>
                    </Link>
                    <div className="p-4">
                      <Link
                        href={`/watch/${entry._id}`}
                        className="line-clamp-2 text-base font-semibold text-white hover:text-yt-red"
                      >
                        {entry.title}
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeVideo(entry._id)}
                        disabled={busy}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-yt-hover px-3.5 py-1.5 text-xs font-medium text-yt-secondary transition hover:bg-white/15 hover:text-white disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>
    </main>
  );
}
