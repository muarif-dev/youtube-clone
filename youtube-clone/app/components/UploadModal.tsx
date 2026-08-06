"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { X, Film, CloudUpload, ImagePlus, Loader, CircleCheck, Ban } from "lucide-react";

type Visibility = "Public" | "Unlisted" | "Private";
type UploadStatus = "idle" | "uploading" | "done" | "error";

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  type?: "video" | "short";
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, index)).toFixed(index > 1 ? 1 : 0)} ${units[index]}`;
}

function uploadWithProgress(
  file: File,
  resourceType: "video" | "image",
  onProgress: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "youtube_preset");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/pnu0l1ye/${resourceType}/upload`);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.secure_url) {
            resolve(data.secure_url);
          } else {
            reject(new Error("Upload response missing URL"));
          }
        } catch {
          reject(new Error("Upload failed"));
        }
      } else {
        reject(new Error("Upload failed"));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(formData);
  });
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Unable to read file"));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const el = document.createElement("video");
    el.preload = "metadata";
    el.onloadedmetadata = () => {
      const duration = Number.isFinite(el.duration) ? el.duration : 0;
      URL.revokeObjectURL(url);
      resolve(Math.round(duration));
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    el.src = url;
  });
}

const CATEGORIES = ["Web Dev", "Gaming", "Music", "Tech", "Lifestyle"];

const visibilityHints: Record<Visibility, string> = {
  Public: "Anyone can view this video.",
  Unlisted: "Only people with the link can view this video.",
  Private: "Only you can view this video.",
};

export default function UploadModal({ open, onClose, type = "video" }: UploadModalProps) {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("Public");
  const [category, setCategory] = useState("Web Dev");
  const [videoDuration, setVideoDuration] = useState(0);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoStatus, setVideoStatus] = useState<UploadStatus>("idle");

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [thumbnailProgress, setThumbnailProgress] = useState(0);
  const [thumbnailStatus, setThumbnailStatus] = useState<UploadStatus>("idle");

  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const handleVideoFile = async (file: File) => {
    if (videoStatus === "uploading") return;
    setVideoFile(file);
    setVideoStatus("uploading");
    setVideoProgress(0);
    try {
      const url = await uploadWithProgress(file, "video", setVideoProgress);
      const seconds = await getVideoDuration(file);
      setVideoDuration(seconds);
      setVideoUrl(url);
      setVideoStatus("done");
    } catch (error) {
      console.error("Video upload error:", error);
      setVideoStatus("error");
    }
  };

  const handleThumbnailFile = async (file: File) => {
    setThumbnailFile(file);
    setThumbnailStatus("uploading");
    setThumbnailProgress(0);
    try {
      const preview = await readFileAsDataURL(file);
      setThumbnailPreview(preview);
      const url = await uploadWithProgress(file, "image", setThumbnailProgress);
      setThumbnailUrl(url);
      setThumbnailStatus("done");
    } catch (error) {
      console.error("Thumbnail upload error:", error);
      setThumbnailStatus("error");
    }
  };

  const canPublish =
    !!videoUrl &&
    !!thumbnailUrl &&
    title.trim().length > 0 &&
    videoStatus === "done" &&
    thumbnailStatus === "done" &&
    !submitting;

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("Web Dev");
    setVideoFile(null);
    setVideoUrl("");
    setVideoProgress(0);
    setVideoStatus("idle");
    setThumbnailFile(null);
    setThumbnailPreview("");
    setThumbnailUrl("");
    setThumbnailProgress(0);
    setThumbnailStatus("idle");
    setSubmitting(false);
  };

  const handlePublish = async () => {
    if (!canPublish) return;
    setSubmitting(true);
    try {
      if (!videoUrl || !thumbnailUrl) {
        throw new Error("Video or thumbnail URL is missing. Please re-upload the files.");
      }
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        videoUrl,
        thumbnailUrl,
        visibility,
        duration: videoDuration,
        type,
      };
      console.log("Submitting payload:", payload);

      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish video");

      onClose();
      resetForm();
      router.push("/");
      router.refresh();
      window.location.reload();
    } catch (error) {
      console.error("Upload Error:", error);
      alert(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-[#282828] shadow-2xl">
        <div className="flex items-center justify-between border-b border-black/50 px-6 py-4">
          <div>
            <h2 className="text-xl font-medium text-white">
              {type === "short" ? "Upload a Short" : "Upload videos"}
            </h2>
            <p className="mt-0.5 text-xs text-yt-secondary">
              Drag and drop or select files to start.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-yt-secondary transition hover:bg-[#3f3f3f] hover:text-white"
            aria-label="Close upload dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {status === "loading" ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-yt-secondary">
            <Loader className="h-8 w-8 animate-spin" />
            <p className="text-sm">Checking your session...</p>
          </div>
        ) : !session ? (
          <div className="flex flex-col items-center justify-center gap-5 px-6 py-16 text-center">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#3f3f3f]">
              <Film className="h-7 w-7 text-yt-secondary" />
            </span>
            <div>
              <p className="text-lg font-medium text-white">Sign in to upload</p>
              <p className="mt-2 text-sm text-yt-secondary">
                You need an account to publish videos and manage your channel.
              </p>
            </div>
            <button
              type="button"
              onClick={() => signIn()}
              className="rounded-full bg-yt-red px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#CC0000]"
            >
              Sign In
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
              {!videoFile ? (
                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragActive(false);
                    const file = event.dataTransfer.files?.[0];
                    if (file) handleVideoFile(file);
                  }}
                  onClick={() => videoInputRef.current?.click()}
                  className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition ${
                    dragActive
                      ? "border-yt-red bg-yt-red/10"
                      : "border-[#5a5a5a] bg-black/30 hover:border-yt-secondary"
                  }`}
                >
                  <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#3f3f3f]">
                    <CloudUpload className="h-8 w-8 text-yt-secondary" />
                  </span>
                  <p className="text-base font-medium text-white">
                    Drag and drop {type === "short" ? "a Short" : "a video"} file to upload
                  </p>
                  <p className="text-sm text-yt-secondary">
                    Your {type === "short" ? "short" : "video"} will be private until you publish it
                  </p>
                  <span className="mt-1 rounded-full bg-white px-4 py-2 text-sm font-medium text-black">
                    Select file
                  </span>
                </div>
              ) : (
                <div className="rounded-xl border border-yt-border bg-black/30 p-4">
                  <div className="flex items-center gap-4">
                    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#3f3f3f]">
                      <Film className="h-6 w-6 text-yt-secondary" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{videoFile.name}</p>
                      <p className="mt-0.5 text-xs text-yt-secondary">{formatBytes(videoFile.size)}</p>
                    </div>
                    {videoStatus === "done" ? (
                      <CircleCheck className="h-6 w-6 shrink-0 text-green-500" />
                    ) : videoStatus === "error" ? (
                      <Ban className="h-6 w-6 shrink-0 text-red-500" />
                    ) : (
                      <span className="shrink-0 text-sm font-medium text-yt-secondary">
                        {videoProgress}%
                      </span>
                    )}
                  </div>
                  {videoStatus === "uploading" && (
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#3f3f3f]">
                      <div
                        className="h-full rounded-full bg-yt-red transition-[width] duration-200"
                        style={{ width: `${videoProgress}%` }}
                      />
                    </div>
                  )}
                  {videoStatus === "error" && (
                    <p className="mt-2 text-xs text-red-400">
                      Upload failed.{" "}
                      <button
                        type="button"
                        onClick={() => videoInputRef.current?.click()}
                        className="underline"
                      >
                        Try again
                      </button>
                    </p>
                  )}
                </div>
              )}
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) handleVideoFile(file);
                  event.target.value = "";
                }}
              />

              <div>
                <label className="mb-2 block text-sm font-medium text-white">Thumbnail</label>
                {thumbnailPreview ? (
                  <div
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragActive(true);
                    }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={(event) => {
                      event.preventDefault();
                      setDragActive(false);
                      const file = event.dataTransfer.files?.[0];
                      if (file) handleThumbnailFile(file);
                    }}
                    className="flex flex-col gap-4 sm:flex-row"
                  >
                    <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg border border-yt-border bg-black sm:w-44">
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex min-w-0 flex-col justify-between gap-3 py-1">
                      <div>
                        <p className="truncate text-sm font-medium text-white">
                          {thumbnailFile?.name}
                        </p>
                        <p className="mt-1 text-xs text-yt-secondary">
                          {thumbnailFile ? formatBytes(thumbnailFile.size) : ""}
                        </p>
                        {thumbnailStatus === "uploading" && (
                          <p className="mt-2 flex items-center gap-2 text-xs text-yt-secondary">
                            <Loader className="h-4 w-4 animate-spin" />
                            Uploading {thumbnailProgress}%
                          </p>
                        )}
                        {thumbnailStatus === "done" && (
                          <p className="mt-2 flex items-center gap-1 text-xs text-green-500">
                            <CircleCheck className="h-4 w-4" />
                            Ready
                          </p>
                        )}
                        {thumbnailStatus === "error" && (
                          <p className="mt-2 text-xs text-red-400">Upload failed.</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => thumbInputRef.current?.click()}
                        className="self-start rounded-full bg-[#3f3f3f] px-4 py-1.5 text-xs font-medium text-white transition hover:bg-[#4d4d4d]"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragActive(true);
                    }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={(event) => {
                      event.preventDefault();
                      setDragActive(false);
                      const file = event.dataTransfer.files?.[0];
                      if (file) handleThumbnailFile(file);
                    }}
                    onClick={() => thumbInputRef.current?.click()}
                    className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition ${
                      dragActive
                        ? "border-yt-red bg-yt-red/10"
                        : "border-[#5a5a5a] bg-black/30 hover:border-yt-secondary"
                    }`}
                  >
                    <ImagePlus className="h-8 w-8 text-yt-secondary" />
                    <p className="text-sm text-yt-secondary">
                      Drag and drop an image, or select a file
                    </p>
                  </div>
                )}
                <input
                  ref={thumbInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleThumbnailFile(file);
                    event.target.value = "";
                  }}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="upload-title" className="mb-2 block text-sm font-medium text-white">
                    {type === "short" ? "Short title" : "Title"}
                  </label>
                  <input
                    id="upload-title"
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder={type === "short" ? "Add a title for your short" : "Add a title that describes your video"}
                    className="w-full rounded-lg border border-[#5a5a5a] bg-[#121212] px-4 py-3 text-sm text-white placeholder:text-yt-secondary focus:border-yt-red focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="upload-desc" className="mb-2 block text-sm font-medium text-white">
                    Description
                  </label>
                  <textarea
                    id="upload-desc"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={1}
                    placeholder="Tell viewers about your video"
                    className="w-full rounded-lg border border-[#5a5a5a] bg-[#121212] px-4 py-3 text-sm text-white placeholder:text-yt-secondary focus:border-yt-red focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="upload-category" className="mb-2 block text-sm font-medium text-white">
                  Category
                </label>
                <select
                  id="upload-category"
                  required
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full rounded-lg border border-[#5a5a5a] bg-[#121212] px-4 py-3 text-sm text-white focus:border-yt-red focus:outline-none"
                >
                  {CATEGORIES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="upload-visibility" className="mb-2 block text-sm font-medium text-white">
                  Visibility
                </label>
                <select
                  id="upload-visibility"
                  value={visibility}
                  onChange={(event) => setVisibility(event.target.value as Visibility)}
                  className="w-full rounded-lg border border-[#5a5a5a] bg-[#121212] px-4 py-3 text-sm text-white focus:border-yt-red focus:outline-none"
                >
                  <option value="Public">Public</option>
                  <option value="Unlisted">Unlisted</option>
                  <option value="Private">Private</option>
                </select>
                <p className="mt-2 text-xs text-yt-secondary">{visibilityHints[visibility]}</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-black/50 px-6 py-4">
              <p className="hidden text-xs text-yt-secondary sm:block">
                By publishing you agree to the Terms of Service.
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full px-4 py-2 text-sm font-medium text-white transition hover:bg-[#3f3f3f]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={!canPublish}
                  className="rounded-full bg-yt-red px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#CC0000] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Publishing..." : "Publish"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
