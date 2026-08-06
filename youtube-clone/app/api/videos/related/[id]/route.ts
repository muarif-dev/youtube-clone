import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Video from "@/models/Video";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") || 20);

    await connectToDatabase();
    const current = await Video.findById(id).select("category type userId");
    if (!current) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const related = await Video.find({
      _id: { $ne: id },
      userId: { $exists: true },
      $or: [{ category: current.category }, { userId: current.userId }],
    })
      .sort({ createdAt: -1 })
      .limit(Math.max(1, Math.min(limit, 50)))
      .populate("userId", "name channelName image");

    return NextResponse.json(related, { status: 200 });
  } catch (error: unknown) {
    console.error("GET related videos Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error fetching related videos" },
      { status: 500 }
    );
  }
}
