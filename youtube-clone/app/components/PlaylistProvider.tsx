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
  emptyStore,
  getPlaylists,
  removeEntry,
  upsertEntry,
  type PlaylistEntry,
  type PlaylistId,
  type PlaylistSource,
} from "@/lib/playlists";

export type PlaylistsMap = Record<PlaylistId, PlaylistEntry[]>;

interface ServerPlaylist {
  _id: string;
  name: string;
  userId: string;
  videos: string[];
  isPrivate: boolean;
  containsVideo: boolean;
  count: number;
  entries: Array<{ _id: string; title: string; thumbnailUrl: string; videoUrl: string }>;
}

interface PlaylistContextValue {
  ready: boolean;
  authenticated: boolean;
  playlists: PlaylistsMap;
  isMember: (videoId: string, playlistId: PlaylistId) => boolean;
  saveToPlaylist: (video: PlaylistSource, playlistId: PlaylistId) => Promise<boolean>;
  removeFromPlaylist: (videoId: string, playlistId: PlaylistId) => Promise<boolean>;
  toggleInPlaylist: (video: PlaylistSource, playlistId: PlaylistId) => Promise<boolean>;
}

const NAME_TO_KEY: Record<string, PlaylistId> = {
  "Watch Later": "watchLater",
  Favorites: "favorites",
  "Music Mix": "musicMix",
};

function toEntry(raw: unknown): PlaylistEntry {
  const source = (raw ?? {}) as Partial<PlaylistEntry> & { videoId?: string };
  const videoId = source._id ?? source.videoId ?? "";
  return {
    _id: String(videoId),
    title: source.title || "Untitled video",
    thumbnailUrl: source.thumbnailUrl || "",
    videoUrl: source.videoUrl || "",
    addedAt: source.addedAt || new Date().toISOString(),
  };
}

function normalizeStore(serverPlaylists: ServerPlaylist[]): PlaylistsMap {
  const result: PlaylistsMap = { watchLater: [], favorites: [], musicMix: [] };
  if (!Array.isArray(serverPlaylists)) return result;
  for (const playlist of serverPlaylists) {
    const key = NAME_TO_KEY[playlist.name];
    if (!key) continue;
    result[key] = Array.isArray(playlist.entries) ? playlist.entries.map(toEntry) : [];
  }
  return result;
}

function buildKeyToId(serverPlaylists: ServerPlaylist[]): Record<PlaylistId, string | null> {
  const result: Record<PlaylistId, string | null> = {
    watchLater: null,
    favorites: null,
    musicMix: null,
  };
  if (!Array.isArray(serverPlaylists)) return result;
  for (const playlist of serverPlaylists) {
    const key = NAME_TO_KEY[playlist.name];
    if (key) result[key] = playlist._id;
  }
  return result;
}

const PlaylistContext = createContext<PlaylistContextValue | null>(null);

export function PlaylistProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const authenticated = status === "authenticated";
  const [ready, setReady] = useState(false);
  const [playlists, setPlaylists] = useState<PlaylistsMap>(() => getPlaylists());
  const [keyToId, setKeyToId] = useState<Record<PlaylistId, string | null>>({
    watchLater: null,
    favorites: null,
    musicMix: null,
  });

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
          const serverPlaylists = Array.isArray(data.playlists) ? (data.playlists as ServerPlaylist[]) : [];
          if (!cancelled) {
            setKeyToId(buildKeyToId(serverPlaylists));
            setPlaylists((current) => ({
              ...current,
              ...normalizeStore(serverPlaylists),
            }));
          }
        } catch (err) {
          console.error("PlaylistProvider: failed to load server playlists:", err);
        } finally {
          if (!cancelled) setReady(true);
        }
      } else {
        setPlaylists(emptyStore());
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

  const syncPlaylist = useCallback((data: { playlist?: ServerPlaylist }) => {
    const playlist = data.playlist;
    if (!playlist) return;
    const key = NAME_TO_KEY[playlist.name];
    if (!key) return;
    setPlaylists((current) => ({
      ...current,
      [key]: Array.isArray(playlist.entries) ? playlist.entries.map(toEntry) : [],
    }));
  }, []);

  const saveToPlaylist = useCallback(
    async (video: PlaylistSource, playlistId: PlaylistId): Promise<boolean> => {
      if (!authenticated) {
        console.log("PlaylistProvider: sign in required to save to playlists");
        return false;
      }

      const entry = toEntry(video);
      setPlaylists((current) => upsertEntry(current, playlistId, entry));

      const playlistDocId = keyToId[playlistId];
      if (!playlistDocId) {
        console.error("PlaylistProvider: no server playlist id for", playlistId);
        return false;
      }

      try {
        const res = await fetch(`/api/playlists/${playlistDocId}`, {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId: entry._id, checked: true }),
        });
        const data = (await res.json()) as { playlist?: ServerPlaylist; error?: string };
        if (!res.ok) {
          throw new Error(data.error || `PATCH /api/playlists failed with status ${res.status}`);
        }
        syncPlaylist(data);
        console.log(`PlaylistProvider: synced "${entry.title}" to ${playlistId} on server`);
        return true;
      } catch (err) {
        console.error("PlaylistProvider: failed to save video:", err);
        return false;
      }
    },
    [authenticated, keyToId, syncPlaylist]
  );

  const removeFromPlaylist = useCallback(
    async (videoId: string, playlistId: PlaylistId): Promise<boolean> => {
      if (!authenticated) {
        console.log("PlaylistProvider: sign in required to update playlists");
        return false;
      }

      setPlaylists((current) => removeEntry(current, playlistId, videoId));

      const playlistDocId = keyToId[playlistId];
      if (!playlistDocId) {
        console.error("PlaylistProvider: no server playlist id for", playlistId);
        return false;
      }

      try {
        const res = await fetch(`/api/playlists/${playlistDocId}`, {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId, checked: false }),
        });
        const data = (await res.json()) as { playlist?: ServerPlaylist; error?: string };
        if (!res.ok) {
          throw new Error(data.error || `PATCH /api/playlists failed with status ${res.status}`);
        }
        syncPlaylist(data);
        console.log(`PlaylistProvider: removed ${videoId} from ${playlistId} on server`);
        return true;
      } catch (err) {
        console.error("PlaylistProvider: failed to remove video:", err);
        return false;
      }
    },
    [authenticated, keyToId, syncPlaylist]
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
