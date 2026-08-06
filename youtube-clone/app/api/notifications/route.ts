import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Notification from "@/models/Notification";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const notifications = await Notification.find({ recipient: session.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("sender", "name channelName image")
      .populate("videoId", "title thumbnailUrl");

    const unreadCount = await Notification.countDocuments({
      recipient: session.user.id,
      read: false,
    });

    return NextResponse.json({ notifications, unreadCount }, { status: 200 });
  } catch (error: unknown) {
    console.error("Notifications GET Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const body = await request.json();
    const { id } = body as { id?: string };

    if (id) {
      await Notification.updateOne(
        { _id: id, recipient: session.user.id },
        { $set: { read: true } }
      );
    } else {
      await Notification.updateMany(
        { recipient: session.user.id, read: false },
        { $set: { read: true } }
      );
    }

    return NextResponse.json({ message: "Notifications marked as read" }, { status: 200 });
  } catch (error: unknown) {
    console.error("Notifications PATCH Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update notifications" },
      { status: 500 }
    );
  }
}
