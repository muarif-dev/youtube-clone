import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Video from "@/models/Video";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await connectToDatabase();
    const video = await Video.findById(id).populate("userId", "name channelName image subscribers");
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const updatedVideo = await Video.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate("userId", "name channelName image subscribers");
    return NextResponse.json(updatedVideo, { status: 200 });
  } catch (error: any) {
    console.error("GET video Error:", error);
    return NextResponse.json(
      { error: error?.message || "Error fetching video" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  try {
    const { id } = await context.params;
    await connectToDatabase();
    const video = await Video.findById(id);
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const body = await request.json();
    const { action, comment, title, description, thumbnailUrl } = body as {
      action?: string;
      comment?: string;
      title?: string;
      description?: string;
      thumbnailUrl?: string;
    };

    let updatedVideo = video;

    if (action === "like" || action === "unlike") {
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const increment = action === "like" ? 1 : -1;
      const nextLikes = Math.max((video.likes ?? 0) + increment, 0);
      updatedVideo = await Video.findByIdAndUpdate(id, { likes: nextLikes }, { new: true }).populate("userId", "name channelName image subscribers");
    } else if (action === "comment") {
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (!comment?.trim()) {
        return NextResponse.json({ error: "Comment is required" }, { status: 400 });
      }
      updatedVideo = await Video.findByIdAndUpdate(
        id,
        {
          $push: {
            comments: {
              userId: session.user.id,
              userName: session.user.name || session.user.email?.split("@")[0] || "Anonymous",
              userAvatar: session.user.image || "",
              content: comment.trim(),
              createdAt: new Date(),
            },
          },
        },
        { new: true }
      ).populate("userId", "name channelName image subscribers");
    } else {
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (video.userId.toString() !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const updates: Record<string, any> = {};
      if (title) updates.title = title;
      if (description) updates.description = description;
      if (thumbnailUrl) updates.thumbnailUrl = thumbnailUrl;

      updatedVideo = await Video.findByIdAndUpdate(id, updates, { new: true }).populate("userId", "name channelName image subscribers");
    }

    if (!updatedVideo) {
      return NextResponse.json({ error: "Unable to update video" }, { status: 500 });
    }

    return NextResponse.json(updatedVideo, { status: 200 });
  } catch (error: any) {
    console.error("PATCH video Error:", error);
    return NextResponse.json(
      { error: error?.message || "Error updating video" },
      { status: 500 }
    );
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
    const video = await Video.findById(id);
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }
    if (video.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await Video.findByIdAndDelete(id);
    return NextResponse.json({ message: "Video deleted" }, { status: 200 });
  } catch (error: any) {
    console.error("DELETE video Error:", error);
    return NextResponse.json(
      { error: error?.message || "Error deleting video" },
      { status: 500 }
    );
  }
}
