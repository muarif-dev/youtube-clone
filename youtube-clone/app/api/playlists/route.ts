import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";

const PLAYLIST_KEYS = ["watchLater", "favorites", "musicMix"] as const;
type PlaylistKey = (typeof PLAYLIST_KEYS)[number];
type PlaylistItem = { videoId: string; title: string; thumbnailUrl: string; videoUrl: string; addedAt: Date };
type PlaylistsStore = Record<PlaylistKey, PlaylistItem[]>;

interface PlaylistRequest {
  playlist?: string;
  videoId?: string;
  title?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
}

function normalizeStore(raw: unknown): PlaylistsStore {
  const source = (raw ?? {}) as Partial<PlaylistsStore>;
  return {
    watchLater: Array.isArray(source.watchLater) ? source.watchLater : [],
    favorites: Array.isArray(source.favorites) ? source.favorites : [],
    musicMix: Array.isArray(source.musicMix) ? source.musicMix : [],
  };
}

function readStore(user: unknown): PlaylistsStore {
  const playlists = (user as { playlists?: unknown }).playlists;
  return normalizeStore(playlists);
}

function isPlaylistKey(value: string): value is PlaylistKey {
  return (PLAYLIST_KEYS as readonly string[]).includes(value);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const store = readStore(user);
    console.log("Playlists GET: loaded playlists for", session.user.id);
    return NextResponse.json({ playlists: store }, { status: 200 });
  } catch (error) {
    console.error("Playlists GET Error:", error);
    return NextResponse.json({ error: "Unable to load playlists" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const body = (await request.json()) as PlaylistRequest;
    const { playlist, videoId, title, thumbnailUrl, videoUrl } = body;

    if (!playlist || !isPlaylistKey(playlist)) {
      return NextResponse.json({ error: "Invalid playlist" }, { status: 400 });
    }
    if (!videoId) {
      return NextResponse.json({ error: "videoId is required" }, { status: 400 });
    }

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const store = readStore(user);
    const normalizedVideoId = String(videoId);
    const alreadySaved = store[playlist].some((item) => String(item.videoId) === normalizedVideoId);
    if (alreadySaved) {
      return NextResponse.json({ playlists: store }, { status: 200 });
    }

    const entry: PlaylistItem = {
      videoId: normalizedVideoId,
      title: String(title ?? ""),
      thumbnailUrl: String(thumbnailUrl ?? ""),
      videoUrl: String(videoUrl ?? ""),
      addedAt: new Date(),
    };

    const nextStore: PlaylistsStore = {
      ...store,
      [playlist]: [entry, ...store[playlist]].slice(0, 50),
    };

    (user as { playlists?: PlaylistsStore }).playlists = nextStore;
    await user.save();

    console.log(`Playlists POST: saved video ${normalizedVideoId} to ${playlist}`);
    return NextResponse.json({ playlists: nextStore }, { status: 200 });
  } catch (error) {
    console.error("Playlists POST Error:", error);
    return NextResponse.json({ error: "Failed to save video" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const body = (await request.json()) as PlaylistRequest;
    const { playlist, videoId } = body;

    if (!playlist || !isPlaylistKey(playlist)) {
      return NextResponse.json({ error: "Invalid playlist" }, { status: 400 });
    }
    if (!videoId) {
      return NextResponse.json({ error: "videoId is required" }, { status: 400 });
    }

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const store = readStore(user);
    const normalizedVideoId = String(videoId);
    const nextStore: PlaylistsStore = {
      ...store,
      [playlist]: store[playlist].filter((item) => String(item.videoId) !== normalizedVideoId),
    };

    (user as { playlists?: PlaylistsStore }).playlists = nextStore;
    await user.save();

    console.log(`Playlists DELETE: removed video ${normalizedVideoId} from ${playlist}`);
    return NextResponse.json({ playlists: nextStore }, { status: 200 });
  } catch (error) {
    console.error("Playlists DELETE Error:", error);
    return NextResponse.json({ error: "Failed to remove video" }, { status: 500 });
  }
}
