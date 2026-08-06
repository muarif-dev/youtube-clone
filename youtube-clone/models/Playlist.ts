import mongoose, { Schema } from "mongoose";

const PlaylistSchema = new Schema(
  {
    name: { type: String, required: true },
    userId: { type: String, required: true },
    videos: { type: [String], default: [] },
    isPrivate: { type: Boolean, default: false },
  },
  { timestamps: true }
);

delete mongoose.models.Playlist;

const Playlist = mongoose.models.Playlist || mongoose.model("Playlist", PlaylistSchema);

export default Playlist;
