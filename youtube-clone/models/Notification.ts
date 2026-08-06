import mongoose, { Schema } from "mongoose";

const NotificationSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["like", "subscription", "upload"], default: "upload" },
    sender: { type: Schema.Types.ObjectId, ref: "User" },
    videoId: { type: Schema.Types.ObjectId, ref: "Video" },
    title: { type: String, default: "" },
    body: { type: String, default: "" },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

delete mongoose.models.Notification;

const Notification = mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);

export default Notification;
