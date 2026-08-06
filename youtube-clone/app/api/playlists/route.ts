import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Playlist from "@/models/Playlist";
import Video from "@/models/Video";

const SYSTEM_PLAYLISTS = [
  { key: "watchLater", name: "Watch Later" },
  { key: "favorites", name: "Favorites" },
  { key: "musicMix", name: "Music Mix" },
] as const;

interface PlaylistView {
  _id: string;
  name: string;
  userId: string;
  videos: string[];
  isPrivate: boolean;
  containsVideo: boolean;
  count: number;
  entries: Array<{ _id: string; title: string; thumbnailUrl: string; videoUrl: string }>;
}

function toVideoIds(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return values.map((x) => String(x));
}

async function ensureSystemPlaylists(userId: string) {
  for (const { name } of SYSTEM_PLAYLISTS) {
    const exists = await Playlist.exists({ userId, name });
    if (!exists) {
      await Playlist.create({ userId, name, videos: [], isPrivate: name !== "Watch Later" });
    }
  }
}

async function buildViews(
  docs: Array<{ _id: unknown; name: string; userId: string; videos: string[]; isPrivate: boolean }>,
  videoId?: string | null
): Promise<PlaylistView[]> {
  const allIds = docs.flatMap((doc) => toVideoIds(doc.videos));
  const uniqueIds = Array.from(new Set(allIds));
  const videoDocs = uniqueIds.length
    ? await Video.find({ _id: { $in: uniqueIds } }).select("title thumbnailUrl videoUrl")
    : [];
  const videoMap = new Map<string, { title: string; thumbnailUrl: string; videoUrl: string }>();
  for (const v of videoDocs) {
    videoMap.set(String(v._id), {
      title: v.title,
      thumbnailUrl: v.thumbnailUrl,
      videoUrl: v.videoUrl,
    });
  }
  return docs.map((doc) => {
    const videos = toVideoIds(doc.videos);
    const entries = videos
      .map((id) => {
        const meta = videoMap.get(id);
        return meta
          ? { _id: id, title: meta.title, thumbnailUrl: meta.thumbnailUrl, videoUrl: meta.videoUrl }
          : null;
      })
      .filter((entry): entry is { _id: string; title: string; thumbnailUrl: string; videoUrl: string } => Boolean(entry));
    return {
      _id: String(doc._id),
      name: doc.name,
      userId: doc.userId,
      videos,
      isPrivate: Boolean(doc.isPrivate),
      containsVideo: videoId ? videos.includes(videoId) : false,
      count: videos.length,
      entries,
    };
  });
}

async function loadUserPlaylists(userId: string, videoId?: string | null) {
  const docs = await Playlist.find({ userId }).sort({ createdAt: 1 });
  return buildViews(docs, videoId);
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const userId = String(session.user.id);
    const videoId = new URL(request.url).searchParams.get("videoId");

    await ensureSystemPlaylists(userId);
    const playlists = await loadUserPlaylists(userId, videoId);

    return NextResponse.json({ playlists }, { status: 200 });
  } catch (error: unknown) {
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
    const userId = String(session.user.id);
    const body = (await request.json()) as {
      name?: string;
      videoId?: string;
      isPrivate?: boolean;
      create?: boolean;
      title?: string;
      playlist?: string;
    };

    const name = body.name?.trim() || body.title?.trim() || "";
    if (!name) {
      return NextResponse.json({ error: "Playlist name is required" }, { status: 400 });
    }

    const doc = await Playlist.create({
      userId,
      name,
      videos: body.videoId ? [String(body.videoId)] : [],
      isPrivate: Boolean(body.isPrivate),
    });
    const playlists = await loadUserPlaylists(userId, body.videoId ? String(body.videoId) : null);
    return NextResponse.json({ playlists, playlist: playlists.find((p) => p._id === String(doc._id)) }, { status: 201 });
  } catch (error: unknown) {
    console.error("Playlists POST Error:", error);
    return NextResponse.json({ error: "Failed to create playlist" }, { status: 500 });
  }
}
