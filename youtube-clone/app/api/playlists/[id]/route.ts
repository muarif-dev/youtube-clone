import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Playlist from "@/models/Playlist";
import Video from "@/models/Video";

function toVideoIds(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return values.map((x) => String(x));
}

async function buildPlaylistView(
  doc: { _id: unknown; name?: string; userId?: string; videos?: string[]; isPrivate?: boolean } | null,
  videoId?: string | null
) {
  const videos = toVideoIds(doc?.videos);
  const uniqueIds = Array.from(new Set(videos));
  const videoDocs = uniqueIds.length
    ? await Video.find({ _id: { $in: uniqueIds } }).select("title thumbnailUrl videoUrl duration")
    : [];
  const videoMap = new Map<string, { title: string; thumbnailUrl: string; videoUrl: string; duration?: number | string }>();
  for (const v of videoDocs) {
    videoMap.set(String(v._id), {
      title: v.title,
      thumbnailUrl: v.thumbnailUrl,
      videoUrl: v.videoUrl,
      duration: v.duration,
    });
  }
  const entries = videos
    .map((id) => {
      const meta = videoMap.get(id);
      return meta
        ? { _id: id, title: meta.title, thumbnailUrl: meta.thumbnailUrl, videoUrl: meta.videoUrl, duration: meta.duration }
        : null;
    })
    .filter(
      (entry): entry is { _id: string; title: string; thumbnailUrl: string; videoUrl: string; duration: string | number | undefined } => Boolean(entry)
    );
  return {
    _id: String(doc?._id),
    name: doc?.name,
    userId: doc?.userId,
    videos,
    isPrivate: Boolean(doc?.isPrivate),
    containsVideo: videoId ? videos.includes(videoId) : false,
    count: videos.length,
    entries,
  };
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    await connectToDatabase();
    const playlist = await Playlist.findById(id);
    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }
    if (String(playlist.userId) !== String(session.user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const view = await buildPlaylistView(playlist);
    return NextResponse.json({ playlist: view }, { status: 200 });
  } catch (error: unknown) {
    console.error("GET playlist Error:", error);
    return NextResponse.json({ error: "Unable to load playlist" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as { videoId?: string; checked?: boolean };
    const videoId = body.videoId ? String(body.videoId) : "";
    if (!videoId) {
      return NextResponse.json({ error: "videoId is required" }, { status: 400 });
    }

    await connectToDatabase();
    const playlist = await Playlist.findById(id);
    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }
    if (String(playlist.userId) !== String(session.user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const videos = toVideoIds(playlist.videos);
    const isMember = videos.includes(videoId);
    const checked = body.checked === undefined ? !isMember : Boolean(body.checked);

    if (checked) {
      await Playlist.updateOne({ _id: id }, { $addToSet: { videos: videoId } });
    } else {
      await Playlist.updateOne({ _id: id }, { $pull: { videos: videoId } });
    }

    const updated = await Playlist.findById(id);
    const view = await buildPlaylistView(updated, videoId);
    return NextResponse.json({ playlist: view }, { status: 200 });
  } catch (error: unknown) {
    console.error("PATCH playlist Error:", error);
    return NextResponse.json({ error: "Failed to update playlist" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    await connectToDatabase();
    const playlist = await Playlist.findById(id);
    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }
    if (String(playlist.userId) !== String(session.user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await Playlist.findByIdAndDelete(id);
    return NextResponse.json({ message: "Playlist deleted" }, { status: 200 });
  } catch (error: unknown) {
    console.error("DELETE playlist Error:", error);
    return NextResponse.json({ error: "Failed to delete playlist" }, { status: 500 });
  }
}
