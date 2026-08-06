import mongoose, { Schema } from "mongoose";

const VideoSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    videoUrl: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    views: { type: Number, default: 0 },
    viewedBy: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], default: [] },
    duration: { type: Number, default: 0 },
    likedBy: { type: [String], default: [] },
    dislikedBy: { type: [String], default: [] },
    comments: {
      type: [
        {
          userId: { type: Schema.Types.ObjectId, ref: "User" },
          userName: { type: String, required: true, default: "Anonymous" },
          userAvatar: { type: String, default: "" },
          content: { type: String, required: true },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    category: { type: String, required: true, default: "All", index: true },
    type: { type: String, enum: ["video", "short"], default: "video" },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

delete mongoose.models.Video;

const Video = mongoose.models.Video || mongoose.model("Video", VideoSchema);

export default Video;
