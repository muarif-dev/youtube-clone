'use client';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

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

export default function ProfileEditor() {
  const { data: session } = useSession();
  const [channelName, setChannelName] = useState("");
  const [bio, setBio] = useState("");
  const [image, setImage] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      if (!session?.user?.id) return;
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        if (res.ok) {
          setChannelName(data.channelName || data.name || "");
          setBio(data.bio || "");
          setImage(data.image || "");
        }
      } catch {
        // ignore for now
      }
    }
    loadProfile();
  }, [session]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataURL(file);
    setImage(dataUrl);
  };

  const handleSave = async () => {
    if (!session?.user?.id) return;
    setSaving(true);
    setMessage("");
    try {
      const payload = { channelName, bio, image };
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
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
    <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/20">
      <h2 className="text-xl font-semibold text-white">Customize your channel</h2>
      <p className="mt-2 text-sm text-slate-400">Set a recognizable channel name, bio, and image.</p>
      <div className="mt-6 space-y-4">
        <div>
          <label className="text-sm text-slate-200">Channel name</label>
          <input value={channelName} onChange={(event) => setChannelName(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" />
        </div>
        <div>
          <label className="text-sm text-slate-200">Profile image</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-red-600 file:text-white file:cursor-pointer hover:file:bg-red-700" />
          {image ? (
            <div className="mt-3 flex items-center gap-3">
              <img src={image} alt="Profile preview" className="h-14 w-14 rounded-full object-cover border border-slate-700" />
              <span className="text-sm text-slate-300">Image will be saved with your profile.</span>
            </div>
          ) : null}
        </div>
        <div>
          <label className="text-sm text-slate-200">Description</label>
          <textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" />
        </div>
        <button type="button" onClick={handleSave} disabled={saving} className="rounded-full bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-400 disabled:opacity-60">
          {saving ? "Saving..." : "Save profile"}
        </button>
        {message ? <p className="text-sm text-slate-300">{message}</p> : null}
      </div>
    </div>
  );
}
