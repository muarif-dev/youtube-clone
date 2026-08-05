"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import {
  getPlaylists,
  mergeStores,
  persistPlaylists,
  removeEntry,
  upsertEntry,
  type PlaylistEntry,
  type PlaylistId,
  type PlaylistSource,
} from "@/lib/playlists";

export type PlaylistsMap = Record<PlaylistId, PlaylistEntry[]>;

interface PlaylistContextValue {
  ready: boolean;
  authenticated: boolean;
  playlists: PlaylistsMap;
  isMember: (videoId: string, playlistId: PlaylistId) => boolean;
  saveToPlaylist: (video: PlaylistSource, playlistId: PlaylistId) => Promise<boolean>;
  removeFromPlaylist: (videoId: string, playlistId: PlaylistId) => Promise<boolean>;
  toggleInPlaylist: (video: PlaylistSource, playlistId: PlaylistId) => Promise<boolean>;
}

function toEntry(raw: unknown): PlaylistEntry {
  const source = (raw ?? {}) as Partial<PlaylistEntry> & { videoId?: string };
  const videoId = source._id ?? source.videoId ?? "";
  if (!videoId) {
    console.warn("Playlist payload missing video id:", raw);
  }
  return {
    _id: String(videoId),
    title: source.title || "Untitled video",
    thumbnailUrl: source.thumbnailUrl || "",
    videoUrl: source.videoUrl || "",
    addedAt: source.addedAt || new Date().toISOString(),
  };
}

function normalizeStore(serverData: unknown): PlaylistsMap {
  const raw = (serverData ?? {}) as Partial<PlaylistsMap>;
  const result: PlaylistsMap = { watchLater: [], favorites: [], musicMix: [] };
  for (const id of Object.keys(result) as PlaylistId[]) {
    const list = raw[id];
    result[id] = Array.isArray(list) ? list.map((entry) => toEntry(entry)) : [];
  }
  return result;
}

const PlaylistContext = createContext<PlaylistContextValue | null>(null);

export function PlaylistProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const authenticated = status === "authenticated";
  const [ready, setReady] = useState(false);
  const [playlists, setPlaylists] = useState<PlaylistsMap>(() => getPlaylists());

  useEffect(() => {
    if (!ready) return;
    persistPlaylists(playlists);
  }, [ready, playlists]);

  useEffect(() => {
    if (status === "loading") return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      if (authenticated) {
        try {
          const res = await fetch("/api/playlists", { credentials: "same-origin" });
          if (!res.ok) {
            throw new Error(`GET /api/playlists failed with status ${res.status}`);
          }
          const data = (await res.json()) as { playlists?: unknown };
          if (!cancelled && data.playlists) {
            setPlaylists((current) => mergeStores(current, normalizeStore(data.playlists)));
            console.log("PlaylistProvider: merged playlists from server");
          }
        } catch (err) {
          console.error("PlaylistProvider: failed to load server playlists, keeping local cache:", err);
        } finally {
          if (!cancelled) setReady(true);
        }
      } else {
        setReady(true);
      }
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [status, authenticated]);

  const isMember = useCallback(
    (videoId: string, playlistId: PlaylistId) => {
      return playlists[playlistId].some((entry) => entry._id === videoId);
    },
    [playlists]
  );

  const saveToPlaylist = useCallback(
    async (video: PlaylistSource, playlistId: PlaylistId): Promise<boolean> => {
      const entry = toEntry(video);
      setPlaylists((current) => upsertEntry(current, playlistId, entry));

      if (!authenticated) {
        console.log(`PlaylistProvider: saved "${entry.title}" to ${playlistId} locally (not authenticated)`);
        return true;
      }

      try {
        const res = await fetch("/api/playlists", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playlist: playlistId,
            videoId: entry._id,
            title: entry.title,
            thumbnailUrl: entry.thumbnailUrl,
            videoUrl: entry.videoUrl,
          }),
        });
        const data = (await res.json()) as { playlists?: unknown; error?: string };
        if (!res.ok) {
          throw new Error(data.error || `POST /api/playlists failed with status ${res.status}`);
        }
        if (data.playlists) {
          setPlaylists((current) => mergeStores(current, normalizeStore(data.playlists)));
        }
        console.log(`PlaylistProvider: synced "${entry.title}" to ${playlistId} on server`);
        return true;
      } catch (err) {
        console.error("PlaylistProvider: failed to save video:", err);
        return false;
      }
    },
    [authenticated]
  );

  const removeFromPlaylist = useCallback(
    async (videoId: string, playlistId: PlaylistId): Promise<boolean> => {
      setPlaylists((current) => removeEntry(current, playlistId, videoId));

      if (!authenticated) {
        console.log(`PlaylistProvider: removed ${videoId} from ${playlistId} locally (not authenticated)`);
        return true;
      }

      try {
        const res = await fetch("/api/playlists", {
          method: "DELETE",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playlist: playlistId, videoId }),
        });
        const data = (await res.json()) as { playlists?: unknown; error?: string };
        if (!res.ok) {
          throw new Error(data.error || `DELETE /api/playlists failed with status ${res.status}`);
        }
        if (data.playlists) {
          setPlaylists((current) => mergeStores(current, normalizeStore(data.playlists)));
        }
        console.log(`PlaylistProvider: removed ${videoId} from ${playlistId} on server`);
        return true;
      } catch (err) {
        console.error("PlaylistProvider: failed to remove video:", err);
        return false;
      }
    },
    [authenticated]
  );

  const toggleInPlaylist = useCallback(
    async (video: PlaylistSource, playlistId: PlaylistId): Promise<boolean> => {
      const isMemberNow = isMember(video._id, playlistId);
      if (isMemberNow) {
        await removeFromPlaylist(video._id, playlistId);
        return false;
      }
      await saveToPlaylist(video, playlistId);
      return true;
    },
    [isMember, saveToPlaylist, removeFromPlaylist]
  );

  return (
    <PlaylistContext.Provider
      value={{
        ready,
        authenticated,
        playlists,
        isMember,
        saveToPlaylist,
        removeFromPlaylist,
        toggleInPlaylist,
      }}
    >
      {children}
    </PlaylistContext.Provider>
  );
}

export function usePlaylists(): PlaylistContextValue {
  const context = useContext(PlaylistContext);
  if (!context) {
    throw new Error("usePlaylists must be used within a PlaylistProvider");
  }
  return context;
}
