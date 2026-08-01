import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Video from "@/models/Video";

export async function GET() {
  try {
    await connectToDatabase();
    const videos = await Video.find({}).sort({ createdAt: -1 });
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
    const { title, description, videoUrl, thumbnailUrl } = body;

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