import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Video from "@/models/Video";
import User from "@/models/User";

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

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  try {
    const { id } = await context.params;
    const body = await request.json();
    const { action } = body as { action?: string };

    if (action !== "dislike") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = String(session.user.id);

    await connectToDatabase();
    const video = await Video.findById(id);
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const dislikedBy = toIds(video.dislikedBy);
    const isDisliked = dislikedBy.includes(userId);

    let updated: VideoDoc | null;
    if (isDisliked) {
      updated = await Video.findByIdAndUpdate(id, { $pull: { dislikedBy: userId } }, { new: true });
    } else {
      updated = await Video.findByIdAndUpdate(
        id,
        { $addToSet: { dislikedBy: userId }, $pull: { likedBy: userId } },
        { new: true }
      );
    }

    if (!updated) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const response = await augmentVideo(updated, userId);
    return NextResponse.json(
      {
        ...response,
        likesCount: response.likes,
        dislikesCount: response.dislikes,
        isLiked: response.isLiked,
        isDisliked: response.isDisliked,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("PATCH video dislike Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error updating video" },
      { status: 500 }
    );
  }
}
