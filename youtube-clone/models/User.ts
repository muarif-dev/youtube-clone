import mongoose, { Schema, model, models } from "mongoose";

const PlaylistItemSchema = new Schema(
  {
    videoId: { type: String, required: true },
    title: { type: String, default: "" },
    thumbnailUrl: { type: String, default: "" },
    videoUrl: { type: String, default: "" },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const PlaylistsSchema = new Schema(
  {
    watchLater: { type: [PlaylistItemSchema], default: [] },
    favorites: { type: [PlaylistItemSchema], default: [] },
    musicMix: { type: [PlaylistItemSchema], default: [] },
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    image: { type: String },
    channelName: { type: String, trim: true },
    bio: { type: String, default: "Creator on YouTube Clone" },
    subscribers: { type: Number, default: 0 },
    playlists: {
      type: PlaylistsSchema,
      default: () => ({ watchLater: [], favorites: [], musicMix: [] }),
    },
  },
  { timestamps: true }
);

const User = models.User || model("User", UserSchema);

export default User;
