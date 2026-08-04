import mongoose, { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    image: { type: String },
    channelName: { type: String, trim: true },
    bio: { type: String, default: "Creator on YouTube Clone" },
    subscribers: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const User = models.User || model("User", UserSchema);

export default User;
