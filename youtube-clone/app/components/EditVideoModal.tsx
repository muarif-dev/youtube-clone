"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader, CircleCheck, Ban, X } from "lucide-react";
import { useToast } from "./ToastProvider";

const CATEGORIES = ["Web Dev", "Gaming", "Music", "Tech", "Lifestyle"];

interface EditVideoData {
  _id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  category?: string;
}

interface EditVideoModalProps {
  open: boolean;
  video: EditVideoData | null;
  onClose: () => void;
  onSaved: (updated: EditVideoData) => void;
}

function uploadImage(file: File, onProgress: (percent: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "youtube_preset");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/pnu0l1ye/image/upload`);
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

export default function EditVideoModal({ open, video, onClose, onSaved }: EditVideoModalProps) {
  const showToast = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [saving, setSaving] = useState(false);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(video?.title ?? "");
    setDescription(video?.description ?? "");
    setCategory(video?.category && CATEGORIES.includes(video.category) ? video.category : CATEGORIES[0]);
    setThumbnailUrl(video?.thumbnailUrl ?? "");
    setUploading(false);
    setUploadProgress(0);
    setUploadStatus("idle");
  }, [open, video]);

  if (!open || !video) return null;

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file");
      return;
    }
    setUploading(true);
    setUploadStatus("uploading");
    setUploadProgress(0);
    try {
      const url = await uploadImage(file, (percent) => setUploadProgress(percent));
      setThumbnailUrl(url);
      setUploadStatus("done");
    } catch {
      setUploadStatus("error");
      showToast("Thumbnail upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showToast("Title is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/videos/${video._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          thumbnailUrl: thumbnailUrl.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Unable to update video");
        return;
      }
      onSaved({
        _id: video._id,
        title: title.trim(),
        description: description.trim(),
        category,
        thumbnailUrl: thumbnailUrl.trim(),
      });
      showToast("Video updated");
      onClose();
    } catch {
      showToast("Unable to update video");
    } finally {
      setSaving(false);
    }
  };

  const categoryOptions = Array.from(
    new Set([...CATEGORIES, video.category || ""].filter(Boolean))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-[#282828] shadow-2xl">
        <div className="flex items-center justify-between border-b border-black/50 px-6 py-4">
          <div>
            <h2 className="text-xl font-medium text-white">Edit video</h2>
            <p className="mt-0.5 text-xs text-yt-secondary">Update the details of this video.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-yt-secondary transition hover:bg-[#3f3f3f] hover:text-white"
            aria-label="Close edit dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-white">Thumbnail</label>
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg border border-yt-border bg-black sm:w-44">
                {thumbnailUrl ? (
                  <img src={thumbnailUrl} alt="Thumbnail preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-yt-secondary">
                    No thumbnail
                  </div>
                )}
              </div>
              <div className="flex min-w-0 flex-col justify-between gap-3 py-1">
                <div className="space-y-2">
                  <input
                    type="text"
                    value={thumbnailUrl}
                    onChange={(event) => setThumbnailUrl(event.target.value)}
                    placeholder="Paste a thumbnail URL"
                    className="w-full rounded-lg border border-[#5a5a5a] bg-[#121212] px-4 py-2.5 text-sm text-white placeholder:text-yt-secondary focus:border-yt-red focus:outline-none"
                  />
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => thumbInputRef.current?.click()}
                      disabled={uploading}
                      className="inline-flex items-center gap-2 rounded-full bg-[#3f3f3f] px-4 py-1.5 text-xs font-medium text-white transition hover:bg-[#4d4d4d] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {uploading ? (
                        <>
                          <Loader className="h-3.5 w-3.5 animate-spin" />
                          Uploading {uploadProgress}%
                        </>
                      ) : (
                        <>
                          <ImagePlus className="h-3.5 w-3.5" />
                          Upload thumbnail
                        </>
                      )}
                    </button>
                    {uploadStatus === "done" && (
                      <span className="flex items-center gap-1 text-xs text-green-500">
                        <CircleCheck className="h-4 w-4" />
                        Ready
                      </span>
                    )}
                    {uploadStatus === "error" && (
                      <span className="flex items-center gap-1 text-xs text-red-400">
                        <Ban className="h-4 w-4" />
                        Upload failed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <input
              ref={thumbInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleFile(file);
                event.target.value = "";
              }}
            />
          </div>

          <div>
            <label htmlFor="edit-title" className="mb-2 block text-sm font-medium text-white">
              Title
            </label>
            <input
              id="edit-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Add a title that describes your video"
              className="w-full rounded-lg border border-[#5a5a5a] bg-[#121212] px-4 py-3 text-sm text-white placeholder:text-yt-secondary focus:border-yt-red focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="edit-desc" className="mb-2 block text-sm font-medium text-white">
              Description
            </label>
            <textarea
              id="edit-desc"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder="Tell viewers about your video"
              className="w-full rounded-lg border border-[#5a5a5a] bg-[#121212] px-4 py-3 text-sm text-white placeholder:text-yt-secondary focus:border-yt-red focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="edit-category" className="mb-2 block text-sm font-medium text-white">
              Category
            </label>
            <select
              id="edit-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full rounded-lg border border-[#5a5a5a] bg-[#121212] px-4 py-3 text-sm text-white focus:border-yt-red focus:outline-none"
            >
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-black/50 px-6 py-4">
          <p className="hidden text-xs text-yt-secondary sm:block">Changes are saved to your video.</p>
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
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-yt-red px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#CC0000] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
