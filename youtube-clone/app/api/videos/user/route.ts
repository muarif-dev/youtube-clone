import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Video from "@/models/Video";
import User from "@/models/User";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const videos = await Video.find({ userId: session.user.id }).sort({ createdAt: -1 });
    return NextResponse.json(videos, { status: 200 });
  } catch (error: unknown) {
    console.error("GET user videos Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error fetching user videos" },
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
    const { channelName, bio, image } = body;

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      {
        ...(channelName ? { channelName } : {}),
        ...(bio ? { bio } : {}),
        ...(image ? { image } : {}),
      },
      { new: true }
    );

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error: unknown) {
    console.error("POST user profile Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error updating profile" },
      { status: 500 }
    );
  }
}
