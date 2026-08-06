import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Video from "@/models/Video";
import User from "@/models/User";
import Notification from "@/models/Notification";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.trim() || "";
    const type = searchParams.get("type") || "all";
    const category = searchParams.get("category") || "All";

    await connectToDatabase();
    const filter: Record<string, unknown> = {};
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
      .populate("userId", "name channelName image");
    return NextResponse.json(
      videos.map((video) => {
        const obj = video.toObject();
        const likedBy = Array.isArray(obj.likedBy) ? obj.likedBy.map((x: unknown) => String(x)) : [];
        const dislikedBy = Array.isArray(obj.dislikedBy) ? obj.dislikedBy.map((x: unknown) => String(x)) : [];
        return { ...obj, likes: likedBy.length, dislikes: dislikedBy.length };
      }),
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("GET Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error fetching videos" },
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

    const createdVideo = await Video.findById(newVideo._id).populate(
      "userId",
      "name channelName image"
    );

    const uploader = await User.findById(session.user.id).select("channelName name");
    const subscribers = await User.find({ subscribedTo: session.user.id }).select("_id");
    if (subscribers.length > 0) {
      const uploaderName = uploader?.channelName || uploader?.name || "A creator";
      await Notification.insertMany(
        subscribers.map((sub) => ({
          recipient: sub._id,
          type: "upload",
          sender: session.user.id,
          videoId: newVideo._id,
          title: `New video from ${uploaderName}`,
          body: title,
        }))
      );
    }

    return NextResponse.json(createdVideo, { status: 201 });
  } catch (error: unknown) {
    console.error("POST Error Details:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}