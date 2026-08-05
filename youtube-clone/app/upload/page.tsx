"use client";

import { useRouter } from "next/navigation";
import UploadModal from "../components/UploadModal";

export default function UploadPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-yt-bg">
      <UploadModal open onClose={() => router.push("/")} type="video" />
    </main>
  );
}
