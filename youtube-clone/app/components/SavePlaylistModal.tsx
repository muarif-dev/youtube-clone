"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, ListPlus, Plus, X } from "lucide-react";
import { useToast } from "./ToastProvider";

interface PlaylistSource {
  _id: string;
  title: string;
  thumbnailUrl: string;
  videoUrl: string;
}

interface PlaylistItem {
  _id: string;
  name: string;
  userId: string;
  videos: string[];
  isPrivate: boolean;
  containsVideo: boolean;
  count: number;
  entries: Array<{ _id: string; title: string; thumbnailUrl: string; videoUrl: string }>;
}

interface SavePlaylistModalProps {
  open: boolean;
  onClose: () => void;
  video: PlaylistSource | null;
}

const SYSTEM_ORDER = ["Watch Later", "Favorites"];

export default function SavePlaylistModal({ open, onClose, video }: SavePlaylistModalProps) {
  const showToast = useToast();

  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadPlaylists = useCallback(async () => {
    if (!video) return;
    try {
      const res = await fetch(`/api/playlists?videoId=${encodeURIComponent(video._id)}`, {
        credentials: "same-origin",
      });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.playlists)) setPlaylists(data.playlists);
    } catch {
      // ignore load errors
    }
  }, [video]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      setCreating(false);
      setName("");
      setIsPrivate(false);
      loadPlaylists();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [open, loadPlaylists]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const sorted = [...playlists].sort((a, b) => {
    const indexA = SYSTEM_ORDER.indexOf(a.name);
    const indexB = SYSTEM_ORDER.indexOf(b.name);
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const togglePlaylist = async (playlist: PlaylistItem) => {
    if (!video || busy) return;
    setBusy(true);
    const checked = !playlist.containsVideo;
    try {
      const res = await fetch(`/api/playlists/${playlist._id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: video._id, checked }),
      });
      const data = await res.json();
      if (res.ok && data.playlist) {
        setPlaylists((current) => current.map((p) => (p._id === data.playlist._id ? data.playlist : p)));
        showToast(checked ? `Saved to ${playlist.name}` : `Removed from ${playlist.name}`);
      } else {
        showToast(data.error || "Failed to update playlist");
      }
    } catch {
      showToast("Failed to update playlist");
    } finally {
      setBusy(false);
    }
  };

  const createPlaylist = async () => {
    if (!video || !name.trim() || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/playlists", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), isPrivate, videoId: video._id }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.playlists)) {
        setPlaylists(data.playlists);
        setName("");
        setIsPrivate(false);
        setCreating(false);
        showToast("Playlist created");
      } else {
        showToast(data.error || "Failed to create playlist");
      }
    } catch {
      showToast("Failed to create playlist");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-yt-border bg-[#282828] p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Save video</h2>
            {video ? <p className="mt-0.5 line-clamp-1 text-xs text-yt-secondary">{video.title}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-yt-secondary transition hover:bg-yt-hover hover:text-white"
            aria-label="Close save dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ul className="mt-5 max-h-72 space-y-1 overflow-y-auto">
          {sorted.map((playlist) => (
            <li key={playlist._id}>
              <button
                type="button"
                onClick={() => togglePlaylist(playlist)}
                disabled={busy}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-[#F1F1F1] transition hover:bg-yt-hover disabled:opacity-60"
              >
                <span
                  className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
                    playlist.containsVideo ? "border-yt-red bg-yt-red" : "border-[#5F5F5F]"
                  }`}
                >
                  {playlist.containsVideo ? <Check className="h-3.5 w-3.5 text-white" /> : null}
                </span>
                <span className="min-w-0 flex-1 truncate">{playlist.name}</span>
                <span className="shrink-0 text-xs text-yt-secondary">{playlist.count}</span>
              </button>
            </li>
          ))}
        </ul>

        {creating ? (
          <div className="mt-4 space-y-3 rounded-xl border border-yt-border bg-[#121212] p-4">
            <div>
              <label htmlFor="new-playlist-title" className="mb-1.5 block text-xs font-medium text-yt-secondary">
                Name
              </label>
              <input
                id="new-playlist-title"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="My awesome playlist"
                autoFocus
                className="w-full rounded-lg border border-yt-border bg-yt-bg px-3 py-2 text-sm text-white outline-none placeholder:text-yt-secondary focus:border-yt-red"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-[#F1F1F1]">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(event) => setIsPrivate(event.target.checked)}
                className="h-4 w-4 accent-yt-red"
              />
              Make this playlist private
            </label>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="rounded-full px-4 py-2 text-sm font-medium text-white transition hover:bg-yt-hover"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={createPlaylist}
                disabled={!name.trim() || busy}
                className="inline-flex items-center gap-1.5 rounded-full bg-yt-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#CC0000] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Create
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-yt-border bg-yt-card px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-yt-hover"
          >
            <ListPlus className="h-4 w-4 text-yt-red" />
            + Create New Playlist
          </button>
        )}
      </div>
    </div>
  );
}
