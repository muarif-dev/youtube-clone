import mongoose, { Schema } from "mongoose";

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

const CustomPlaylistSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    privacy: { type: String, enum: ["Public", "Unlisted", "Private"], default: "Public" },
    videos: { type: [PlaylistItemSchema], default: [] },
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
    subscribers: { type: [String], default: [] },
    subscribedTo: { type: [String], default: [] },
    playlists: {
      type: PlaylistsSchema,
      default: () => ({ watchLater: [], favorites: [], musicMix: [] }),
    },
    customPlaylists: { type: [CustomPlaylistSchema], default: [] },
  },
  { timestamps: true }
);

delete mongoose.models.User;

const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;
