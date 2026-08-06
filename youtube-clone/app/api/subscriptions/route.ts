import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";
import Video from "@/models/Video";

function toIds(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return values.map((x) => String(x));
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const user = await User.findById(session.user.id).select("subscribedTo");

    const channelIds = toIds(user?.subscribedTo);
    const channels = channelIds.length
      ? await User.find({ _id: { $in: channelIds } }).select("name channelName image")
      : [];
    const videos =
      channelIds.length > 0
        ? await Video.find({ userId: { $in: channelIds } })
            .sort({ createdAt: -1 })
            .populate("userId", "name channelName image")
        : [];

    return NextResponse.json({ channels, videos }, { status: 200 });
  } catch (error: unknown) {
    console.error("Subscriptions GET Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load subscriptions" },
      { status: 500 }
    );
  }
}
