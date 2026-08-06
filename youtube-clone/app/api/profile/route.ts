import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";

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
    const user = await User.findById(session.user.id).select("name email channelName image bio subscribers");
    if (!user) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    const subscriberCount = toIds(user.subscribers).length;
    const obj = user.toObject();
    return NextResponse.json({ ...obj, subscriberCount }, { status: 200 });
  } catch (error: unknown) {
    console.error("Profile GET Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load profile" },
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
    const { channelName, bio, image } = body;

    const updates: Record<string, unknown> = {};
    if (channelName !== undefined) updates.channelName = channelName;
    if (bio !== undefined) updates.bio = bio;
    if (image !== undefined) updates.image = image;

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      updates,
      { new: true }
    ).select("name email channelName image bio subscribers");

    if (!updatedUser) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const subscriberCount = toIds(updatedUser.subscribers).length;
    const obj = updatedUser.toObject();
    return NextResponse.json({ ...obj, subscriberCount }, { status: 200 });
  } catch (error: unknown) {
    console.error("Profile PATCH Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update profile" },
      { status: 500 }
    );
  }
}
