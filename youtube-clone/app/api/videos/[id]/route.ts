import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Video from "@/models/Video";
import User from "@/models/User";
import Notification from "@/models/Notification";
import mongoose from "mongoose";

const CHANNEL_SELECT = "name channelName image bio";

type VideoDoc = NonNullable<Awaited<ReturnType<typeof Video.findById>>>;

function toIds(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return values.map((x) => String(x));
}

async function augmentVideo(videoDoc: VideoDoc, viewerId?: string | null) {
  const populated = await Video.populate(videoDoc, { path: "userId", select: CHANNEL_SELECT });
  const ownerId = populated.userId?._id?.toString();
  let subscriberCount = 0;
  let subscribed = false;
  if (ownerId) {
    const owner = await User.findById(ownerId).select("subscribers");
    const subscribers = toIds(owner?.subscribers);
    subscriberCount = subscribers.length;
    subscribed = Boolean(viewerId && subscribers.includes(viewerId));
  }
  const obj = populated.toObject();
  const likedBy = toIds(obj.likedBy);
  const dislikedBy = toIds(obj.dislikedBy);
  const isLiked = viewerId ? likedBy.includes(viewerId) : false;
  const isDisliked = viewerId ? dislikedBy.includes(viewerId) : false;
  return {
    ...obj,
    views: typeof obj.views === "number" ? obj.views : Array.isArray(obj.views) ? obj.views.length : 0,
    likes: likedBy.length,
    dislikes: dislikedBy.length,
    subscriberCount,
    subscribed,
    liked: isLiked,
    disliked: isDisliked,
    isLiked,
    isDisliked,
  };
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    const viewerId = session?.user?.id;

    const video = await Video.findById(id);
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    if (viewerId) {
      const viewedBy = Array.isArray(video.viewedBy) ? video.viewedBy.map((v: unknown) => String(v)) : [];
      if (!viewedBy.includes(viewerId)) {
        await Video.updateOne(
          { _id: id, viewedBy: { $ne: new mongoose.Types.ObjectId(viewerId) } },
          { $addToSet: { viewedBy: viewerId }, $inc: { views: 1 } }
        );
        video.views = Number(video.views ?? 0) + 1;
      }
    }

    const body = await augmentVideo(video, viewerId);
    return NextResponse.json(body, { status: 200 });
  } catch (error: unknown) {
    console.error("GET video Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error fetching video" },
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

    if (action === "like" || action === "dislike") {
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const userId = String(session.user.id);
      const likedBy = toIds(video.likedBy);
      const dislikedBy = toIds(video.dislikedBy);
      const isLiked = likedBy.includes(userId);
      const isDisliked = dislikedBy.includes(userId);

      await Video.updateOne(
        { _id: id },
        [
          {
            $set: {
              likedBy: { $map: { input: { $ifNull: ["$likedBy", []] }, as: "u", in: { $toString: "$$u" } } },
              dislikedBy: { $map: { input: { $ifNull: ["$dislikedBy", []] }, as: "u", in: { $toString: "$$u" } } },
            },
          },
        ]
      );

      let newlyLiked = false;
      if (action === "like") {
        if (isLiked) {
          await Video.updateOne({ _id: id }, { $pull: { likedBy: userId } });
        } else {
          newlyLiked = true;
          await Video.updateOne(
            { _id: id },
            { $addToSet: { likedBy: userId }, $pull: { dislikedBy: userId } }
          );
        }
      } else {
        if (isDisliked) {
          await Video.updateOne({ _id: id }, { $pull: { dislikedBy: userId } });
        } else {
          await Video.updateOne(
            { _id: id },
            { $addToSet: { dislikedBy: userId }, $pull: { likedBy: userId } }
          );
        }
      }

      updatedVideo = await Video.findById(id);

      if (newlyLiked && String(video.userId) !== userId) {
        const actor = await User.findById(userId).select("name channelName image");
        await Notification.create({
          recipient: video.userId,
          type: "like",
          sender: userId,
          videoId: id,
          title: `${actor?.channelName || actor?.name || "Someone"} liked your video`,
          body: video.title,
        });
      }
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
      );
    } else {
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (video.userId.toString() !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const updates: Record<string, unknown> = {};
      if (title) updates.title = title;
      if (description) updates.description = description;
      if (thumbnailUrl) updates.thumbnailUrl = thumbnailUrl;

      updatedVideo = await Video.findByIdAndUpdate(id, updates, { new: true });
    }

    if (!updatedVideo) {
      return NextResponse.json({ error: "Unable to update video" }, { status: 500 });
    }

    const response = await augmentVideo(updatedVideo, session?.user?.id);
    return NextResponse.json(response, { status: 200 });
  } catch (error: unknown) {
    console.error("PATCH video Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error updating video" },
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
  } catch (error: unknown) {
    console.error("DELETE video Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error deleting video" },
      { status: 500 }
    );
  }
}
