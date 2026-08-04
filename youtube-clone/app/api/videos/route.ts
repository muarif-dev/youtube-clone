import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Video from "@/models/Video";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.trim() || "";
    const type = searchParams.get("type") || "all";
    const category = searchParams.get("category") || "All";

    await connectToDatabase();
    const filter: Record<string, any> = {};
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ];
    }
    if (type !== "all") {
      filter.type = type;
    }
    if (category && category !== "All") {
      filter.category = category;
    }

    const videos = await Video.find(filter)
      .sort({ createdAt: -1 })
      .populate("userId", "name channelName image subscribers");
    return NextResponse.json(videos, { status: 200 });
  } catch (error: any) {
    console.error("GET Error:", error);
    return NextResponse.json(
      { error: error?.message || "Error fetching videos" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const body = await request.json();
    const { title, description, videoUrl, thumbnailUrl, category, type } = body;

    if (!title || !description || !videoUrl || !thumbnailUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newVideo = await Video.create({
      title,
      description,
      videoUrl,
      thumbnailUrl,
      category: category || "General",
      type: type || "video",
      userId: session.user.id,
    });

    return NextResponse.json(newVideo, { status: 201 });
  } catch (error: any) {
    console.error("POST Error Details:", error);
    return NextResponse.json(
      { error: error?.message || String(error) },
      { status: 500 }
    );
  }
}