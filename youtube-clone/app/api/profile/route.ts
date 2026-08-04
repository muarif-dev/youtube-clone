import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const user = await User.findById(session.user.id).select("name email channelName image bio subscribers");
    if (!user) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    return NextResponse.json(user, { status: 200 });
  } catch (error: any) {
    console.error("Profile GET Error:", error);
    return NextResponse.json(
      { error: error?.message || "Unable to load profile" },
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
    const { channelName, bio, image, subscribers } = body;

    const updates: Record<string, any> = {};
    if (channelName !== undefined) updates.channelName = channelName;
    if (bio !== undefined) updates.bio = bio;
    if (image !== undefined) updates.image = image;
    if (typeof subscribers === "number") updates.subscribers = subscribers;

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      updates,
      { new: true }
    ).select("name email channelName image bio subscribers");

    if (!updatedUser) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error: any) {
    console.error("Profile PATCH Error:", error);
    return NextResponse.json(
      { error: error?.message || "Unable to update profile" },
      { status: 500 }
    );
  }
}
