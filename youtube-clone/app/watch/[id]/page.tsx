"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ThumbsUp, ThumbsDown, Share, Download, MessageSquare, ChevronLeft, X, Check } from "lucide-react";
import { WatchPageSkeleton } from "../../components/Skeletons";
import { useToast } from "../../components/ToastProvider";

interface IComment {
  _id?: string;
  userId?: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
}

interface IVideo {
  _id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  views: number;
  likes: number;
  comments: IComment[];
  createdAt: string;
  userId: IUserProfile;
}

interface IUserProfile {
  _id: string;
  name: string;
  channelName?: string;
  image?: string;
  bio?: string;
  subscribers?: number;
}

interface ILibraryVideo {
  _id: string;
  title: string;
  thumbnailUrl: string;
  videoUrl: string;
  watchedAt: string;
}

interface ISubscribedChannel {
  _id: string;
  name: string;
  avatar?: string;
}

function formatCount(count: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", compactDisplay: "short" }).format(count);
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
  const showToast = useToast();
  const [video, setVideo] = useState<IVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<IComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [downloaded, setDownloaded] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const toggleVideoLike = (currentVideo: IVideo, nowLiked: boolean) => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("likedVideos");
    const likedVideos: ILibraryVideo[] = raw ? JSON.parse(raw) : [];
    if (nowLiked) {
      const entry: ILibraryVideo = {
        _id: currentVideo._id,
        title: currentVideo.title,
        thumbnailUrl: currentVideo.thumbnailUrl,
        videoUrl: currentVideo.videoUrl,
        watchedAt: new Date().toISOString(),
      };
      const next = [entry, ...likedVideos.filter((item) => item._id !== currentVideo._id)].slice(0, 20);
      window.localStorage.setItem("likedVideos", JSON.stringify(next));
    } else {
      const next = likedVideos.filter((item) => item._id !== currentVideo._id);
      window.localStorage.setItem("likedVideos", JSON.stringify(next));
    }
  };

  const handleSubscribe = () => {
    if (!video) return;
    const next = !subscribed;
    setSubscribed(next);
    setSubscriberCount((count) => Math.max(0, count + (next ? 1 : -1)));
    const raw = window.localStorage.getItem("subscribedChannels");
    const channels: ISubscribedChannel[] = raw ? JSON.parse(raw) : [];
    const entry: ISubscribedChannel = {
      _id: video.userId._id,
      name: video.userId.channelName || video.userId.name || "Creator",
      avatar: video.userId.image,
    };
    const nextChannels = next
      ? [entry, ...channels.filter((channel) => channel._id !== entry._id)].slice(0, 50)
      : channels.filter((channel) => channel._id !== entry._id);
    window.localStorage.setItem("subscribedChannels", JSON.stringify(nextChannels));
  };

  const handleLike = async () => {
    if (!video) return;
    const action = liked ? "unlike" : "like";
    const res = await fetch(`/api/videos/${video._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (res.ok) {
      setVideo(data);
      setLikes(data.likes || 0);
      const nowLiked = !liked;
      setLiked(nowLiked);
      if (disliked) setDisliked(false);
      toggleVideoLike(video, nowLiked);
    } else {
      console.error("Like failed", data);
    }
  };

  const handleDislike = async () => {
    if (!video) return;
    if (disliked) {
      setDisliked(false);
      return;
    }
    if (liked) setLiked(false);
    setDisliked(true);
  };

  const handleShareClick = () => {
    setCopied(false);
    setShareOpen(true);
  };

  const handleCopyLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      showToast("Link copied to clipboard");
    } catch {
      showToast("Could not copy the link.");
    }
  };

  const handleCommentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!commentText.trim() || !video) return;

    try {
      const res = await fetch(`/api/videos/${video._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "comment", comment: commentText.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setVideo(data);
        setComments(data.comments || []);
        setCommentText("");
        setShowComments(true);
      } else {
        console.error("Comment failed", data);
      }
    } catch (error) {
      console.error("Comment submit error", error);
    }
  };

  useEffect(() => {
    if (!id) return;

    async function fetchVideo() {
      try {
        const res = await fetch(`/api/videos/${id}`);
        const data = await res.json();
        if (res.ok) {
          setVideo(data);
          setLikes(data.likes || 0);
          setComments(data.comments || []);
          setSubscriberCount(data.userId?.subscribers ?? 0);
          const storedChannels = window.localStorage.getItem("subscribedChannels");
          const channels: ISubscribedChannel[] = storedChannels ? JSON.parse(storedChannels) : [];
          setSubscribed(channels.some((channel) => channel._id === data.userId?._id));
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
    <main className="min-h-screen bg-yt-bg px-4 pb-24 text-white sm:px-6 md:pb-10 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-yt-border bg-yt-card px-4 py-2 text-sm font-medium text-white transition hover:bg-yt-hover"
          >
            <ChevronLeft className="h-4 w-4 text-yt-red" />
            Home
          </Link>
          <p className="hidden text-sm text-yt-secondary sm:block">
            {video ? video.title : "Now watching"}
          </p>
        </div>

        {loading ? (
          <WatchPageSkeleton />
        ) : error ? (
          <div className="rounded-2xl border border-yt-red bg-yt-card p-12 text-center text-red-300">
            <p className="text-lg font-semibold">{error}</p>
            <p className="mt-3 text-sm text-yt-secondary">Return home and choose another upload.</p>
          </div>
        ) : video ? (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-yt-border bg-black">
              <video
                controls
                poster={video.thumbnailUrl}
                src={video.videoUrl}
                className="aspect-video w-full bg-black object-contain"
              />
            </div>

            <div className="rounded-2xl bg-yt-card p-5">
              <h1 className="text-xl font-semibold text-white sm:text-2xl">{video.title}</h1>

              <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <img
                    src={video.userId.image || `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(video.userId.channelName || video.userId.name || "Creator")}&backgroundType=gradientLinear&colors=red,black,slate`}
                    alt={video.userId.name || "Creator"}
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {video.userId.channelName || video.userId.name || "Creator"}
                    </p>
                    <p className="text-xs text-yt-secondary">{formatCount(subscriberCount)} subscribers</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSubscribe}
                    className={`ml-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                      subscribed
                        ? "bg-yt-hover text-white hover:bg-white/15"
                        : "bg-yt-red text-white hover:bg-[#CC0000]"
                    }`}
                  >
                    {subscribed ? "Subscribed" : "Subscribe"}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex overflow-hidden rounded-full bg-yt-hover">
                    <button
                      type="button"
                      onClick={handleLike}
                      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold transition hover:bg-white/15 ${
                        liked ? "text-yt-red" : "text-white"
                      }`}
                    >
                      <ThumbsUp className="h-5 w-5" />
                      {formatCount(likes)}
                    </button>
                    <span className="my-2 w-px bg-yt-border" />
                    <button
                      type="button"
                      onClick={handleDislike}
                      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold transition hover:bg-white/15 ${
                        disliked ? "text-yt-red" : "text-white"
                      }`}
                    >
                      <ThumbsDown className="h-5 w-5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleShareClick}
                    className="inline-flex items-center gap-2 rounded-full bg-yt-hover px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                  >
                    <Share className="h-5 w-5" />
                    Share
                  </button>
                  <a
                    href={video.videoUrl}
                    download
                    onClick={() => addVideoToDownloads(video)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                      downloaded
                        ? "bg-[#1A6B3A] text-white hover:bg-[#1E7B44]"
                        : "bg-yt-hover text-white hover:bg-white/15"
                    }`}
                  >
                    <Download className="h-5 w-5" />
                    {downloaded ? "Downloaded" : "Download"}
                  </a>
                  <button
                    type="button"
                    onClick={() => setShowComments((current) => !current)}
                    className="inline-flex items-center gap-2 rounded-full bg-yt-hover px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                  >
                    <MessageSquare className="h-5 w-5" />
                    {comments.length > 0 ? formatCount(comments.length) : ""}
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3 text-xs text-yt-secondary">
                <span className="inline-flex items-center gap-2 rounded-full bg-yt-hover px-4 py-2 text-sm font-medium text-white">
                  {formatCount(video.views)} views
                </span>
                <span className="inline-flex items-center rounded-full bg-yt-hover px-4 py-2 text-sm font-medium text-white">
                  {formatDate(video.createdAt)}
                </span>
              </div>

              <p className="mt-4 text-sm leading-6 text-yt-secondary">{video.description}</p>
            </div>

            {showComments && (
              <div className="rounded-2xl bg-yt-card p-5">
                <h2 className="text-lg font-semibold text-white">
                  {comments.length > 0 ? `${formatCount(comments.length)} Comments` : "Comments"}
                </h2>
                <form onSubmit={handleCommentSubmit} className="mt-4 space-y-3">
                  <label className="block text-sm font-medium text-yt-secondary">Add a comment</label>
                  <textarea
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-yt-border bg-[#121212] px-4 py-3 text-sm text-white outline-none placeholder:text-yt-secondary focus:border-yt-red"
                    placeholder="Write your comment..."
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-yt-red px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#CC0000]"
                  >
                    Post Comment
                  </button>
                </form>
                {comments.length > 0 ? (
                  <div className="mt-5 space-y-4">
                    {comments.map((comment) => (
                      <div key={comment._id ?? comment.createdAt} className="flex gap-3 text-sm text-yt-secondary">
                        <img
                          src={comment.userAvatar || `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(comment.userName)}&backgroundType=gradientLinear&colors=red,black,slate`}
                          alt={comment.userName}
                          className="h-9 w-9 shrink-0 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium text-white">{comment.userName}</p>
                          <p className="mt-1 text-white">{comment.content}</p>
                          <p className="mt-1 text-xs text-yt-secondary">
                            {new Date(comment.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-yt-secondary">No comments yet. Be the first to share your thoughts.</p>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {shareOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShareOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-yt-border bg-[#282828] p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Share</h2>
              <button
                type="button"
                onClick={() => setShareOpen(false)}
                className="rounded-full p-2 text-yt-secondary transition hover:bg-yt-hover hover:text-white"
                aria-label="Close share dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {video ? (
              <>
                <p className="mt-4 text-sm text-yt-secondary">{video.title}</p>
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-yt-border bg-[#121212] p-2">
                  <input
                    readOnly
                    value={window.location.href}
                    onFocus={(event) => event.target.select()}
                    className="min-w-0 flex-1 bg-transparent px-2 text-sm text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                      copied ? "bg-[#1A6B3A] text-white" : "bg-yt-red text-white hover:bg-[#CC0000]"
                    }`}
                  >
                    {copied ? <Check className="h-4 w-4" /> : null}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </main>
  );
}
