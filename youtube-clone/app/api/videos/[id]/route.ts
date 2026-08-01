import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Video from "@/models/Video";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await connectToDatabase();
    const video = await Video.findById(id);
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const updatedVideo = await Video.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true });
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

    const body = await request.json();
    const updates: Record<string, any> = {};
    if (body.title) updates.title = body.title;
    if (body.description) updates.description = body.description;
    if (body.thumbnailUrl) updates.thumbnailUrl = body.thumbnailUrl;

    const updatedVideo = await Video.findByIdAndUpdate(id, updates, { new: true });
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
