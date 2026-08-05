"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Camera, Check, Loader2 } from "lucide-react";

export interface EditableProfile {
  channelName?: string;
  name?: string;
  image?: string;
  bio?: string;
}

interface ProfileEditorProps {
  profile: EditableProfile | null;
  onUpdate: (updates: Partial<EditableProfile>) => void;
  onSaved: (profile: EditableProfile) => void;
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

export default function ProfileEditor({ profile, onUpdate, onSaved }: ProfileEditorProps) {
  const { data: session } = useSession();
  const [channelName, setChannelName] = useState(profile?.channelName || profile?.name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [image, setImage] = useState(profile?.image || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [prevProfile, setPrevProfile] = useState(profile);
  if (profile !== prevProfile) {
    setPrevProfile(profile);
    setChannelName(profile?.channelName || profile?.name || "");
    setBio(profile?.bio || "");
    setImage(profile?.image || "");
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataURL(file);
    setImage(dataUrl);
    onUpdate({ image: dataUrl });
  };

  const handleChannelNameChange = (value: string) => {
    setChannelName(value);
  };

  const handleBioChange = (value: string) => {
    setBio(value);
  };

  const handleSave = async () => {
    if (!session?.user?.id) return;
    setSaving(true);
    setMessage("");
    try {
      const payload = { channelName: channelName.trim() || undefined, bio, image };
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        onSaved(data);
        setMessage("Profile updated successfully.");
      } else {
        const data = await res.json();
        setMessage(data.error || "Unable to update profile right now.");
      }
    } catch {
      setMessage("Unable to update profile right now.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-yt-border bg-yt-card p-6">
      <h2 className="text-xl font-semibold text-white">Customize your channel</h2>
      <p className="mt-2 text-sm text-yt-secondary">
        Changes preview instantly in your channel header and are saved to your profile.
      </p>
      <div className="mt-6 space-y-4">
        <div>
          <label className="text-sm text-yt-secondary">Channel name</label>
          <input
            value={channelName}
            onChange={(event) => handleChannelNameChange(event.target.value)}
            className="mt-2 w-full rounded-xl border border-yt-border bg-[#121212] px-4 py-3 text-white focus:border-yt-red focus:outline-none"
          />
        </div>
        <div>
          <label className="text-sm text-yt-secondary">Profile image</label>
          <div className="mt-2 flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-yt-border bg-yt-hover">
              <img
                src={
                  image ||
                  `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(channelName || "channel")}&backgroundType=gradientLinear&colors=red,black,slate`
                }
                alt="Profile preview"
                className="h-full w-full object-cover"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Camera className="h-6 w-6 text-white" />
              </span>
            </div>
            <label className="cursor-pointer rounded-full bg-yt-hover px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15">
              Change image
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
          <p className="mt-2 text-xs text-yt-secondary">The avatar preview updates instantly.</p>
        </div>
        <div>
          <label className="text-sm text-yt-secondary">Description</label>
          <textarea
            value={bio}
            onChange={(event) => handleBioChange(event.target.value)}
            rows={3}
            className="mt-2 w-full rounded-xl border border-yt-border bg-[#121212] px-4 py-3 text-white focus:border-yt-red focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-yt-red px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#CC0000] disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {saving ? "Saving..." : "Save profile"}
          </button>
          {message ? <p className="text-sm text-yt-secondary">{message}</p> : null}
        </div>
      </div>
    </div>
  );
}
