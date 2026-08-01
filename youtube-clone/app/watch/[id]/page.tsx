"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface IVideo {
  _id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  views: number;
  createdAt: string;
}

interface ILibraryVideo {
  _id: string;
  title: string;
  thumbnailUrl: string;
  videoUrl: string;
  watchedAt: string;
}

function formatViews(views: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", compactDisplay: "short" }).format(views);
}

function formatDate(createdAt: string) {
  return new Date(createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function WatchPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const [video, setVideo] = useState<IVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<string[]>([]);
  const [commentText, setCommentText] = useState("");
  const [downloaded, setDownloaded] = useState(false);

  const addVideoToHistory = (currentVideo: IVideo) => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("watchHistory");
    const history: ILibraryVideo[] = raw ? JSON.parse(raw) : [];
    const nextEntry: ILibraryVideo = {
      _id: currentVideo._id,
      title: currentVideo.title,
      thumbnailUrl: currentVideo.thumbnailUrl,
      videoUrl: currentVideo.videoUrl,
      watchedAt: new Date().toISOString(),
    };
    const nextHistory = [nextEntry, ...history.filter((item) => item._id !== currentVideo._id)].slice(0, 20);
    window.localStorage.setItem("watchHistory", JSON.stringify(nextHistory));
  };

  const addVideoToDownloads = (currentVideo: IVideo) => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("downloadedVideos");
    const downloads: ILibraryVideo[] = raw ? JSON.parse(raw) : [];
    const nextDownload: ILibraryVideo = {
      _id: currentVideo._id,
      title: currentVideo.title,
      thumbnailUrl: currentVideo.thumbnailUrl,
      videoUrl: currentVideo.videoUrl,
      watchedAt: new Date().toISOString(),
    };
    const nextDownloads = [nextDownload, ...downloads.filter((item) => item._id !== currentVideo._id)].slice(0, 20);
    window.localStorage.setItem("downloadedVideos", JSON.stringify(nextDownloads));
    setDownloaded(true);
    window.alert("Video saved to your library downloads.");
  };

  const handleLike = () => {
    if (liked) {
      setLiked(false);
      setLikes((current) => Math.max(0, current - 1));
      return;
    }
    setLiked(true);
    setLikes((current) => current + 1);
    if (disliked) {
      setDisliked(false);
      setDislikes((current) => Math.max(0, current - 1));
    }
  };

  const handleDislike = () => {
    if (disliked) {
      setDisliked(false);
      setDislikes((current) => Math.max(0, current - 1));
      return;
    }
    setDisliked(true);
    setDislikes((current) => current + 1);
    if (liked) {
      setLiked(false);
      setLikes((current) => Math.max(0, current - 1));
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("Video link copied to clipboard");
    } catch {
      alert("Could not copy link. Please share manually.");
    }
  };

  const handleCommentSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!commentText.trim()) return;
    setComments((current) => [commentText.trim(), ...current]);
    setCommentText("");
    setShowComments(true);
  };

  useEffect(() => {
    if (!id) return;

    async function fetchVideo() {
      try {
        const res = await fetch(`/api/videos/${id}`);
        const data = await res.json();
        if (res.ok) {
          setVideo(data);
          addVideoToHistory(data);
          const savedDownloads = window.localStorage.getItem("downloadedVideos");
          const downloads: ILibraryVideo[] = savedDownloads ? JSON.parse(savedDownloads) : [];
          setDownloaded(downloads.some((item) => item._id === data._id));
        } else {
          setError(data.error || "Unable to load the video.");
        }
      } catch (err) {
        console.error(err);
        setError("Unable to load the video.");
      } finally {
        setLoading(false);
      }
    }

    fetchVideo();
  }, [id]);

  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 pb-10 pt-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-red-500">Now watching</p>
            <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Video Player</h1>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:border-red-500 hover:bg-slate-800"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Home
          </Link>
        </div>

        {loading ? (
          <div className="rounded-[2rem] border border-dashed border-slate-700 bg-slate-900/90 p-12 text-center text-slate-400 shadow-inner shadow-slate-950/20">
            Loading video...
          </div>
        ) : error ? (
          <div className="rounded-[2rem] border border-red-500 bg-slate-900/90 p-12 text-center text-red-300 shadow-inner shadow-slate-950/20">
            <p className="text-lg font-semibold">{error}</p>
            <p className="mt-3 text-sm text-slate-400">Return home and choose another upload.</p>
          </div>
        ) : video ? (
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-4 shadow-xl shadow-slate-950/20 sm:p-6">
              <div className="aspect-video overflow-hidden rounded-[1.5rem] bg-black">
                <video controls src={video.videoUrl} className="h-full w-full bg-black object-cover" />
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/20">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-white">{video.title}</h2>
                      <p className="mt-3 text-sm text-slate-400">{video.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSubscribed((current) => !current)}
                      className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
                        subscribed ? "bg-slate-800 text-slate-100 hover:bg-slate-700" : "bg-red-500 text-white hover:bg-red-400"
                      }`}
                    >
                      {subscribed ? "Subscribed" : "Subscribe"}
                    </button>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleLike}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition ${
                        liked ? "border-red-500 bg-red-500/10 text-red-400" : "border-slate-700 bg-slate-950 text-slate-300 hover:border-red-500 hover:text-white"
                      }`}
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 9V5a1 1 0 00-1-1H8a1 1 0 00-1 1v12" />
                        <path d="M20 12h-6l1-5-6 6v5h11z" />
                      </svg>
                      Like {likes > 0 ? `(${likes})` : ""}
                    </button>
                    <button
                      type="button"
                      onClick={handleDislike}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition ${
                        disliked ? "border-red-500 bg-red-500/10 text-red-400" : "border-slate-700 bg-slate-950 text-slate-300 hover:border-red-500 hover:text-white"
                      }`}
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 15v4a1 1 0 001 1h5a1 1 0 001-1V7" />
                        <path d="M4 12h6l-1 5 6-6V6H4z" />
                      </svg>
                      Dislike {dislikes > 0 ? `(${dislikes})` : ""}
                    </button>
                    <button
                      type="button"
                      onClick={handleShare}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-red-500 hover:text-white"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7" />
                        <path d="M16 6l-4-4-4 4" />
                        <path d="M12 2v13" />
                      </svg>
                      Share
                    </button>
                    <a
                      href={video.videoUrl}
                      download
                      onClick={() => addVideoToDownloads(video)}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition ${
                        downloaded ? "border-green-500 bg-green-500/10 text-green-300 hover:bg-green-500/20" : "border-slate-700 bg-slate-950 text-slate-300 hover:border-red-500 hover:text-white"
                      }`}
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3v12m0 0l-4-4m4 4l4-4" />
                        <path d="M4 19h16" />
                      </svg>
                      {downloaded ? "Downloaded" : "Download"}
                    </a>
                    <button
                      type="button"
                      onClick={() => setShowComments((current) => !current)}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-red-500 hover:text-white"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                      </svg>
                      Comment {comments.length > 0 ? `(${comments.length})` : ""}
                    </button>
                  </div>
                  {showComments && (
                    <div className="mt-5 rounded-3xl border border-slate-800 bg-slate-950/90 p-4">
                      <form onSubmit={handleCommentSubmit} className="space-y-3">
                        <label className="block text-sm font-medium text-slate-200">Add a comment</label>
                        <textarea
                          value={commentText}
                          onChange={(event) => setCommentText(event.target.value)}
                          rows={3}
                          className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-red-500"
                          placeholder="Write your comment..."
                        />
                        <button
                          type="submit"
                          className="rounded-full bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-400"
                        >
                          Post Comment
                        </button>
                      </form>
                      {comments.length > 0 ? (
                        <div className="mt-5 space-y-3">
                          {comments.map((comment, index) => (
                            <div key={`${comment}-${index}`} className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4 text-sm text-slate-200">
                              {comment}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-4 text-sm text-slate-500">No comments yet. Be the first to share your thoughts.</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-slate-300">
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/80 px-4 py-2">
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-red-500" fill="currentColor">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    {formatViews(video.views)}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/80 px-4 py-2">
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 7V3m8 4V3M5 11h14M4 19h16" />
                    </svg>
                    {formatDate(video.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
