import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  const message = "Please define MONGODB_URI in .env.local";
  console.error(message);
  throw new Error(message);
}

interface MongooseCache {
  conn: mongoose.Connection | null;
  promise: Promise<mongoose.Connection> | null;
}

const globalWithCache = globalThis as typeof globalThis & {
  __mongooseCache?: MongooseCache;
};

const cached: MongooseCache = globalWithCache.__mongooseCache || { conn: null, promise: null };
globalWithCache.__mongooseCache = cached;

export async function connectToDatabase() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI!).then((m) => m.connection);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    console.error("MongoDB connection failed:", e);
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}