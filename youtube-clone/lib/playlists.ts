export const PLAYLISTS = {
  watchLater: { id: "watchLater", label: "Watch Later" },
  favorites: { id: "favorites", label: "My Favorites" },
  musicMix: { id: "musicMix", label: "Music Mix" },
} as const;

export type PlaylistId = keyof typeof PLAYLISTS;

export interface PlaylistEntry {
  _id: string;
  title: string;
  thumbnailUrl: string;
  videoUrl: string;
  addedAt: string;
}

export type PlaylistSource = Pick<PlaylistEntry, "_id" | "title" | "thumbnailUrl" | "videoUrl">;

export type PlaylistsStore = Record<PlaylistId, PlaylistEntry[]>;

export const PLAYLIST_IDS: PlaylistId[] = Object.keys(PLAYLISTS) as PlaylistId[];

export function emptyStore(): PlaylistsStore {
  return { watchLater: [], favorites: [], musicMix: [] };
}

export function getPlaylists(): PlaylistsStore {
  return emptyStore();
}

export function upsertEntry(store: PlaylistsStore, playlistId: PlaylistId, entry: PlaylistEntry): PlaylistsStore {
  return {
    ...store,
    [playlistId]: [entry, ...store[playlistId].filter((item) => item._id !== entry._id)].slice(0, 50),
  };
}

export function removeEntry(store: PlaylistsStore, playlistId: PlaylistId, videoId: string): PlaylistsStore {
  return {
    ...store,
    [playlistId]: store[playlistId].filter((item) => item._id !== videoId),
  };
}

export function mergeStores(base: PlaylistsStore, incoming: PlaylistsStore): PlaylistsStore {
  const merged: PlaylistsStore = emptyStore();
  for (const id of PLAYLIST_IDS) {
    const byId = new Map<string, PlaylistEntry>();
    for (const item of base[id]) byId.set(item._id, item);
    for (const item of incoming[id]) byId.set(item._id, item);
    merged[id] = Array.from(byId.values());
  }
  return merged;
}
