"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";

export default function UploadPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const uploadToCloudinary = async (file: File, resourceType: "video" | "image") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "youtube_preset");

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/pnu0l1ye/${resourceType}/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Upload failed");
    return data.secure_url;
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    try {
      const url = await uploadToCloudinary(file, "video");
      setVideoUrl(url);
    } catch (error: any) {
      alert(`Video upload failed: ${error.message}`);
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingThumb(true);
    try {
      const url = await uploadToCloudinary(file, "image");
      setThumbnailUrl(url);
    } catch (error: any) {
      alert(`Thumbnail upload failed: ${error.message}`);
    } finally {
      setUploadingThumb(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      alert("Please sign in before uploading a video.");
      return;
    }
    if (!videoUrl || !thumbnailUrl) {
      alert("Please upload both a video file and a thumbnail image.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, videoUrl, thumbnailUrl }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/");
      } else {
        alert(`Failed to save: ${data.error || "Unknown server error"}`);
      }
    } catch (err: any) {
      alert(`Something went wrong: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <p className="text-lg">Checking your session...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-slate-950 px-4 text-white">
        <div className="max-w-md rounded-3xl border border-slate-800 bg-slate-900/95 p-8 text-center shadow-xl shadow-slate-950/30">
          <h1 className="text-3xl font-semibold text-white">Sign in to upload</h1>
          <p className="mt-3 text-sm text-slate-400">You need an account to publish videos and manage your channel.</p>
          <button
            type="button"
            onClick={() => signIn()}
            className="mt-6 rounded-2xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-400"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-slate-900 text-white rounded-lg mt-10 shadow-xl border border-slate-800">
      <h1 className="text-2xl font-bold mb-6 text-red-500">Upload Video</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-200">
            Video Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 rounded bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-red-500"
            placeholder="e.g. My Awesome Next.js Video"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-slate-200">
            Description
          </label>
          <textarea
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 rounded bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-red-500"
            placeholder="Enter video description"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-slate-200">
            Upload Video File
          </label>
          <input
            type="file"
            accept="video/*"
            onChange={handleVideoUpload}
            className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-red-600 file:text-white file:cursor-pointer hover:file:bg-red-700"
          />
          {uploadingVideo && <p className="text-sm text-yellow-400 mt-1">Uploading video to Cloudinary...</p>}
          {videoUrl && <p className="text-sm text-green-400 mt-1">✅ Video ready!</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-slate-200">
            Upload Thumbnail Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleThumbnailUpload}
            className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-red-600 file:text-white file:cursor-pointer hover:file:bg-red-700"
          />
          {uploadingThumb && <p className="text-sm text-yellow-400 mt-1">Uploading thumbnail to Cloudinary...</p>}
          {thumbnailUrl && <p className="text-sm text-green-400 mt-1">✅ Thumbnail ready!</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || uploadingVideo || uploadingThumb}
          className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded transition disabled:opacity-50"
        >
          {isSubmitting ? "Publishing..." : "Publish Video"}
        </button>
      </form>
    </div>
  );
}