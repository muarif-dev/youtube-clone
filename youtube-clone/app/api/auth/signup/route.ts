import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: "A user with that email already exists" }, { status: 409 });
    }

    const hashedPassword = await hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });

    return NextResponse.json({ message: "Account created", userId: user._id }, { status: 201 });
  } catch (error: any) {
    console.error("Signup Error:", error);
    return NextResponse.json(
      { error: error?.message || "Unable to create account" },
      { status: 500 }
    );
  }
}
