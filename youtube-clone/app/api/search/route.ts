import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Video from "@/models/Video";

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function buildDateFilter(uploadDate: string): Record<string, unknown> | null {
  const now = new Date();
  switch (uploadDate) {
    case "today":
      return { $gte: startOfDay(now) };
    case "yesterday": {
      const start = startOfDay(now);
      const end = new Date(start);
      end.setDate(end.getDate() - 1);
      return { $gte: end, $lt: start };
    }
    case "this week": {
      const start = startOfDay(now);
      start.setDate(start.getDate() - start.getDay());
      return { $gte: start };
    }
    case "this month":
      return { $gte: new Date(now.getFullYear(), now.getMonth(), 1) };
    case "this year":
      return { $gte: new Date(now.getFullYear(), 0, 1) };
    default:
      return null;
  }
}

function buildDurationFilter(duration: string): Record<string, unknown> | null {
  switch (duration) {
    case "short":
      return { $gt: 0, $lt: 180 };
    case "medium":
      return { $gte: 240, $lte: 1200 };
    case "long":
      return { $gt: 1200 };
    default:
      return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const uploadDate = searchParams.get("uploadDate") || "any";
    const duration = searchParams.get("duration") || "any";
    const type = searchParams.get("type") || "all";

    if (type === "channel" || type === "playlist") {
      return NextResponse.json({ videos: [], channels: [], playlists: [] }, { status: 200 });
    }

    await connectToDatabase();
    const filter: Record<string, unknown> = {};

    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    const dateRange = buildDateFilter(uploadDate);
    if (dateRange) filter.createdAt = dateRange;

    const durationRange = buildDurationFilter(duration);
    if (durationRange) filter.duration = durationRange;

    if (type === "video") filter.type = "video";
    else if (type === "short") filter.type = "short";

    const videos = await Video.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("userId", "name channelName image");

    return NextResponse.json(
      {
        videos: videos.map((video) => {
          const obj = video.toObject();
          const likedBy = Array.isArray(obj.likedBy) ? obj.likedBy.map((x: unknown) => String(x)) : [];
          const dislikedBy = Array.isArray(obj.dislikedBy) ? obj.dislikedBy.map((x: unknown) => String(x)) : [];
          return { ...obj, likes: likedBy.length, dislikes: dislikedBy.length };
        }),
        channels: [],
        playlists: [],
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Search GET Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error searching" },
      { status: 500 }
    );
  }
}
