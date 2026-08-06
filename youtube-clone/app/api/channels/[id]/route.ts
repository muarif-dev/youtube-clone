import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import Video from "@/models/Video";
import Notification from "@/models/Notification";

const CHANNEL_SELECT = "name channelName image bio createdAt subscribers";

function toIds(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return values.map((x) => String(x));
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    const viewerId = session?.user?.id;

    const channel = await User.findById(id).select(CHANNEL_SELECT);
    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    const videos = await Video.find({ userId: id })
      .sort({ createdAt: -1 })
      .populate("userId", "name channelName image");

    const subscribers = toIds(channel.subscribers);
    const subscriberCount = subscribers.length;
    const subscribed = Boolean(viewerId && subscribers.includes(String(viewerId)));

    return NextResponse.json(
      {
        user: channel,
        videos,
        subscriberCount,
        subscribed,
        isOwner: Boolean(viewerId && String(viewerId) === id),
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("GET channel Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error fetching channel" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    await connectToDatabase();
    const viewerId = String(session.user.id);
    const channelId = String(id);

    if (channelId === viewerId) {
      return NextResponse.json({ error: "You cannot subscribe to your own channel" }, { status: 400 });
    }

    await User.updateOne(
      { _id: channelId, subscribers: { $not: { $type: "array" } } },
      { $unset: { subscribers: "" } }
    );

    const targetUser = await User.findById(channelId);
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentSubscribers = Array.isArray(targetUser.subscribers) ? toIds(targetUser.subscribers) : [];
    const isSubscribed = currentSubscribers.includes(viewerId);

    if (isSubscribed) {
      await User.findByIdAndUpdate(channelId, { $pull: { subscribers: viewerId } });
    } else {
      await User.findByIdAndUpdate(channelId, { $addToSet: { subscribers: viewerId } });
    }

    const updatedUser = await User.findById(channelId).select("subscribers");
    const nowSubscribed = toIds(updatedUser?.subscribers).includes(viewerId);

    if (nowSubscribed && !isSubscribed) {
      await User.updateOne({ _id: viewerId }, { $addToSet: { subscribedTo: channelId } });
      const actor = await User.findById(viewerId).select("name channelName image");
      await Notification.create({
        recipient: channelId,
        type: "subscription",
        sender: viewerId,
        title: `${actor?.channelName || actor?.name || "Someone"} subscribed to your channel`,
        body: "A new viewer subscribed to your channel.",
      });
    } else if (!nowSubscribed && isSubscribed) {
      await User.updateOne({ _id: viewerId }, { $pull: { subscribedTo: channelId } });
    }

    const subscriberCount = toIds(updatedUser?.subscribers).length;

    return NextResponse.json(
      { subscriberCount, subscribed: nowSubscribed, isSubscribed: nowSubscribed, channelId },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("PATCH channel Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error updating subscription" },
      { status: 500 }
    );
  }
}
