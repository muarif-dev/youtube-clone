import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Video from "@/models/Video";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const videos = await Video.find({ userId: session.user.id }).sort({ createdAt: -1 });
    return NextResponse.json(videos, { status: 200 });
  } catch (error: any) {
    console.error("GET user videos Error:", error);
    return NextResponse.json(
      { error: error?.message || "Error fetching user videos" },
      { status: 500 }
    );
  }
}
