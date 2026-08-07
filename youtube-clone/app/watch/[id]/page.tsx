"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ThumbsUp,
  ThumbsDown,
  Share,
  Download,
  MessageSquare,
  ListPlus,
  X,
  Check,
  Loader2,
  Trash2,
  Pencil,
} from "lucide-react";
import { WatchPageSkeleton, RelatedVideosSkeleton } from "../../components/Skeletons";
import { useToast } from "../../components/ToastProvider";
import SavePlaylistModal from "../../components/SavePlaylistModal";
import EditVideoModal from "../../components/EditVideoModal";
import { formatCount, formatDuration, formatViews, formatRelativeDate, channelDisplayName } from "@/lib/video";

interface IComment {
  _id?: string;
  userId?: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
}

interface IUserProfile {
  _id: string;
  name: string;
  channelName?: string;
  image?: string;
  bio?: string;
}

interface IVideo {
  _id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  category?: string;
  views: number;
  likes: number;
  dislikes?: number;
  likesCount?: number;
  dislikesCount?: number;
  isLiked?: boolean;
  isDisliked?: boolean;
  comments: IComment[];
  createdAt: string;
  duration?: number | string;
  liked: boolean;
  disliked: boolean;
  subscribed: boolean;
  subscriberCount: number;
  userId: IUserProfile;
}

interface IRelatedVideo {
  _id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl: string;
  views: number | unknown[];
  likes: number;
  createdAt: string;
  duration?: number | string;
  type?: string;
  userId?: IUserProfile;
}

interface ILibraryVideo {
  _id: string;
  title: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration?: number | string;
  watchedAt: string;
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
  const router = useRouter();
  const { data: session } = useSession();
  const showToast = useToast();

  const [video, setVideo] = useState<IVideo | null>(null);
  const [related, setRelated] = useState<IRelatedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [comments, setComments] = useState<IComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [downloaded, setDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [interactionBusy, setInteractionBusy] = useState(false);

  const addVideoToHistory = useCallback((currentVideo: IVideo) => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("watchHistory");
    const history: ILibraryVideo[] = raw ? JSON.parse(raw) : [];
    const nextEntry: ILibraryVideo = {
      _id: currentVideo._id,
      title: currentVideo.title,
      thumbnailUrl: currentVideo.thumbnailUrl,
      videoUrl: currentVideo.videoUrl,
      duration: currentVideo.duration,
      watchedAt: new Date().toISOString(),
    };
    const nextHistory = [nextEntry, ...history.filter((item) => item._id !== currentVideo._id)].slice(0, 20);
    window.localStorage.setItem("watchHistory", JSON.stringify(nextHistory));
  }, []);

  const addVideoToDownloads = useCallback((currentVideo: IVideo) => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("downloadedVideos");
    const downloads: ILibraryVideo[] = raw ? JSON.parse(raw) : [];
    const nextDownload: ILibraryVideo = {
      _id: currentVideo._id,
      title: currentVideo.title,
      thumbnailUrl: currentVideo.thumbnailUrl,
      videoUrl: currentVideo.videoUrl,
      duration: currentVideo.duration,
      watchedAt: new Date().toISOString(),
    };
    const nextDownloads = [nextDownload, ...downloads.filter((item) => item._id !== currentVideo._id)].slice(0, 20);
    window.localStorage.setItem("downloadedVideos", JSON.stringify(nextDownloads));
  }, []);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function fetchVideo() {
      try {
        const [videoRes, relatedRes] = await Promise.all([
          fetch(`/api/videos/${id}`),
          fetch(`/api/videos/related/${id}`),
        ]);
        const videoData = await videoRes.json();
        if (videoRes.ok) {
          if (cancelled) return;
          setVideo(videoData);
          setLikes(videoData.likesCount ?? videoData.likes ?? 0);
          setDislikes(videoData.dislikesCount ?? videoData.dislikes ?? 0);
          setComments(videoData.comments || []);
          setLiked(Boolean(videoData.isLiked ?? videoData.liked));
          setDisliked(Boolean(videoData.isDisliked ?? videoData.disliked));
          setSubscribed(Boolean(videoData.subscribed));
          setSubscriberCount(videoData.subscriberCount || 0);
          addVideoToHistory(videoData);
          const savedDownloads = window.localStorage.getItem("downloadedVideos");
          const downloads: ILibraryVideo[] = savedDownloads ? JSON.parse(savedDownloads) : [];
          setDownloaded(downloads.some((item) => item._id === videoData._id));
        } else {
          if (!cancelled) setError(videoData.error || "Unable to load the video.");
        }

        const relatedData = await relatedRes.json();
        if (relatedRes.ok && Array.isArray(relatedData) && !cancelled) {
          const seen = new Set<string>(id ? [id] : []);
          const deduped = relatedData.filter((item: IRelatedVideo) => {
            if (seen.has(item._id)) return false;
            seen.add(item._id);
            return true;
          });
          setRelated(deduped);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Unable to load the video.");
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRelatedLoading(false);
        }
      }
    }

    fetchVideo();
    return () => {
      cancelled = true;
    };
  }, [id, addVideoToHistory]);

  const handleLike = async () => {
    if (!video) return;
    if (!session?.user?.id) {
      showToast("Sign in to like videos");
      return;
    }
    if (interactionBusy) return;
    setInteractionBusy(true);

    const prevLikes = likes;
    const prevDislikes = dislikes;
    const prevLiked = liked;
    const prevDisliked = disliked;

    setLiked(!prevLiked);
    setLikes(!prevLiked ? prevLikes + (prevDisliked ? 0 : 1) : Math.max(0, prevLikes - 1));
    if (prevDisliked) {
      setDisliked(false);
      setDislikes(Math.max(0, prevDislikes - 1));
    }

    const revert = () => {
      setLiked(prevLiked);
      setDisliked(prevDisliked);
      setLikes(prevLikes);
      setDislikes(prevDislikes);
    };

    try {
      const res = await fetch(`/api/videos/${video._id}/like`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "like" }),
      });
      const data = await res.json();
      if (res.ok) {
        const nowLiked = Boolean(data?.isLiked ?? data?.liked);
        const nowDisliked = Boolean(data?.isDisliked ?? data?.disliked);
        setVideo(data);
        setLikes(data?.likesCount ?? data?.likes ?? 0);
        setDislikes(data?.dislikesCount ?? data?.dislikes ?? 0);
        setLiked(nowLiked);
        setDisliked(nowDisliked);
      } else {
        revert();
        showToast(data?.error || "Unable to update like");
      }
    } catch {
      revert();
      showToast("Unable to update like");
    } finally {
      setInteractionBusy(false);
    }
  };

  const handleDislike = async () => {
    if (!video) return;
    if (!session?.user?.id) {
      showToast("Sign in to dislike videos");
      return;
    }
    if (interactionBusy) return;
    setInteractionBusy(true);

    const prevLikes = likes;
    const prevDislikes = dislikes;
    const prevLiked = liked;
    const prevDisliked = disliked;

    setDisliked(!prevDisliked);
    setDislikes(!prevDisliked ? prevDislikes + (prevLiked ? 0 : 1) : Math.max(0, prevDislikes - 1));
    if (prevLiked) {
      setLiked(false);
      setLikes(Math.max(0, prevLikes - 1));
    }

    const revert = () => {
      setLiked(prevLiked);
      setDisliked(prevDisliked);
      setLikes(prevLikes);
      setDislikes(prevDislikes);
    };

    try {
      const res = await fetch(`/api/videos/${video._id}/dislike`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dislike" }),
      });
      const data = await res.json();
      if (res.ok) {
        const nowLiked = Boolean(data?.isLiked ?? data?.liked);
        const nowDisliked = Boolean(data?.isDisliked ?? data?.disliked);
        setVideo(data);
        setLikes(data?.likesCount ?? data?.likes ?? 0);
        setDislikes(data?.dislikesCount ?? data?.dislikes ?? 0);
        setLiked(nowLiked);
        setDisliked(nowDisliked);
      } else {
        revert();
        showToast(data?.error || "Unable to update dislike");
      }
    } catch {
      revert();
      showToast("Unable to update dislike");
    } finally {
      setInteractionBusy(false);
    }
  };

  const handleSubscribe = async () => {
    if (!video) return;
    if (!session?.user?.id) {
      showToast("Sign in to subscribe");
      return;
    }
    const channelId = video.userId?._id;
    if (!channelId) return;
    if (interactionBusy) return;
    setInteractionBusy(true);
    const nextSubscribed = !subscribed;
    const prevSubscriberCount = subscriberCount;
    setSubscribed(nextSubscribed);
    setSubscriberCount((prev) => Math.max(0, prev + (nextSubscribed ? 1 : -1)));
    try {
      const res = await fetch(`/api/channels/${channelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: nextSubscribed ? "subscribe" : "unsubscribe" }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubscribed(Boolean(data.subscribed));
        const count = Number(data.subscriberCount);
        setSubscriberCount(Number.isFinite(count) && count >= 0 ? count : prevSubscriberCount);
        router.refresh();
        showToast(nextSubscribed ? "Subscribed to channel" : "Unsubscribed");
      } else {
        setSubscribed(!nextSubscribed);
        setSubscriberCount(prevSubscriberCount);
        showToast(data.error || "Unable to update subscription");
      }
    } catch {
      setSubscribed(!nextSubscribed);
      setSubscriberCount(prevSubscriberCount);
      showToast("Unable to update subscription");
    } finally {
      setInteractionBusy(false);
    }
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

  const handleDownload = async () => {
    if (!video || downloaded || isDownloading) return;
    setIsDownloading(true);
    const fileName = `${(video.title || "video").replace(/[^a-zA-Z0-9]/g, "_")}.mp4`;
    try {
      const response = await fetch(video.videoUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      addVideoToDownloads(video);
      setDownloaded(true);
      showToast("Download started");
    } catch (err) {
      console.error("Download failed:", err);
      showToast("Could not start download. The video may not be available offline.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleVideoSaved = (updates: Partial<IVideo>) => {
    setVideo((current) => (current ? { ...current, ...updates } : current));
    router.refresh();
  };

  const handleDelete = async () => {
    if (!video) return;
    if (!confirm("Delete this video permanently?")) return;
    try {
      const res = await fetch(`/api/videos/${video._id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Video deleted");
        router.push("/");
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        alert(`Failed to delete: ${data?.error || "Unknown server error"}`);
      }
    } catch (error) {
      console.error("Delete video error:", error);
      alert(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const handleCommentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!commentText.trim() || !video) return;
    if (!session?.user?.id) {
      showToast("Sign in to comment");
      return;
    }

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
      } else {
        showToast(data.error || "Unable to post comment");
      }
    } catch (error) {
      console.error("Comment submit error", error);
      showToast("Unable to post comment");
    }
  };

  const channelId = video?.userId?._id;
  const displayName = channelDisplayName(video?.userId);

  const scrollToComments = () => {
    document.getElementById("comments")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="min-h-screen bg-yt-bg px-4 pb-24 text-white sm:px-6 md:pb-10 lg:px-8">
      <div className="mx-auto max-w-[1400px] space-y-6">
        {loading ? (
          <div className="grid gap-6 lg:grid-cols-[68fr_32fr]">
            <WatchPageSkeleton />
            <RelatedVideosSkeleton />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-yt-red bg-yt-card p-12 text-center text-red-300">
            <p className="text-lg font-semibold">{error}</p>
            <p className="mt-3 text-sm text-yt-secondary">Return home and choose another upload.</p>
          </div>
        ) : video ? (
          <div className="grid items-start gap-6 lg:grid-cols-[68fr_32fr]">
            <div className="min-w-0 space-y-4">
              <div className="overflow-hidden rounded-2xl border border-yt-border bg-black">
                <video
                  key={video.videoUrl}
                  controls
                  autoPlay
                  poster={video.thumbnailUrl}
                  src={video.videoUrl}
                  className="aspect-video w-full bg-black object-contain"
                />
              </div>

              <div className="rounded-2xl bg-yt-card p-5">
                <h1 className="text-xl font-semibold text-white sm:text-2xl">{video.title}</h1>

                <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <Link href={`/channel/${channelId}`} className="shrink-0">
                      <img
                        src={video.userId?.image || `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundType=gradientLinear&colors=red,black,slate`}
                        alt={displayName}
                        className="h-10 w-10 rounded-full object-cover transition hover:opacity-80"
                      />
                    </Link>
                    <div className="min-w-0">
                      <Link href={`/channel/${channelId}`} className="block">
                        <p className="truncate text-sm font-semibold text-white transition hover:text-yt-red">
                          {displayName}
                        </p>
                      </Link>
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
                        aria-pressed={liked}
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
                        aria-pressed={disliked}
                        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold transition hover:bg-white/15 ${
                          disliked ? "text-yt-red" : "text-white"
                        }`}
                      >
                        <ThumbsDown className="h-5 w-5" />
                        {formatCount(dislikes)}
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
                    <button
                      type="button"
                      onClick={handleDownload}
                      disabled={isDownloading}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        downloaded
                          ? "bg-[#1A6B3A] text-white hover:bg-[#1E7B44]"
                          : "bg-yt-hover text-white hover:bg-white/15"
                      }`}
                    >
                      {isDownloading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Download className="h-5 w-5" />
                      )}
                      {isDownloading ? "Downloading..." : downloaded ? "Downloaded" : "Download"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSaveOpen(true)}
                      className="inline-flex items-center gap-2 rounded-full bg-yt-hover px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                    >
                      <ListPlus className="h-5 w-5" />
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={scrollToComments}
                      className="inline-flex items-center gap-2 rounded-full bg-yt-hover px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                    >
                      <MessageSquare className="h-5 w-5" />
                      {(comments || []).length > 0 ? formatCount((comments || []).length) : ""}
                    </button>
                    {session?.user?.id && video?.userId?._id === session.user.id && (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditOpen(true)}
                          className="inline-flex items-center gap-2 rounded-full bg-yt-hover px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                        >
                          <Pencil className="h-5 w-5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={handleDelete}
                          className="inline-flex items-center gap-2 rounded-full bg-yt-hover px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500/20 hover:text-red-400"
                        >
                          <Trash2 className="h-5 w-5" />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3 text-xs text-yt-secondary">
                  <span className="inline-flex items-center gap-2 rounded-full bg-yt-hover px-4 py-2 text-sm font-medium text-white">
                    {formatCount(video?.views ?? 0)} views
                  </span>
                  <span className="inline-flex items-center rounded-full bg-yt-hover px-4 py-2 text-sm font-medium text-white">
                    {formatDate(video.createdAt)}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-6 text-yt-secondary">{video.description}</p>
              </div>

              <div id="comments" className="scroll-mt-20 rounded-2xl bg-yt-card p-5">
                <h2 className="text-lg font-semibold text-white">
                  {(comments || []).length > 0 ? `${formatCount((comments || []).length)} Comments` : "Comments"}
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
                  {(comments || []).length > 0 ? (
                    <div className="mt-5 space-y-4">
                      {(comments || []).map((comment) => (
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
            </div>

            <aside className="min-w-0 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1">
              <div className="space-y-3">
                <h2 className="px-1 text-sm font-semibold text-white">Related videos</h2>
                {relatedLoading ? (
                  <RelatedVideosSkeleton count={8} />
                ) : (related || []).length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-yt-border bg-yt-card p-8 text-center text-sm text-yt-secondary">
                    No related videos found. Check back soon.
                  </div>
                ) : (
                  (related || []).map((item) => {
                    const channel = item.userId as IUserProfile | undefined;
                    const channelName = channelDisplayName(channel);
                    const duration = formatDuration(item.duration);
                    return (
                      <div
                        key={item._id}
                        className="group flex gap-2 rounded-xl p-2 transition hover:bg-yt-card"
                      >
                        <Link href={`/watch/${item._id}`} className="relative shrink-0">
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title}
                            className="aspect-video w-40 rounded-lg object-cover"
                          />
                          {duration ? (
                            <span className="absolute right-1 bottom-1 rounded bg-black/80 px-1 py-0.5 text-[11px] font-medium text-white">
                              {duration}
                            </span>
                          ) : null}
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link href={`/watch/${item._id}`}>
                            <h3 className="line-clamp-2 text-sm font-medium text-white transition group-hover:text-yt-red">
                              {item.title}
                            </h3>
                          </Link>
                          {channel ? (
                            <Link href={`/channel/${channel._id}`} className="mt-1 flex items-center gap-1.5">
                              <img
                                src={
                                  channel.image ||
                                  `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(channelName)}&backgroundType=gradientLinear&colors=red,black,slate`
                                }
                                alt={channelName}
                                className="h-5 w-5 shrink-0 rounded-full bg-yt-hover object-cover"
                              />
                              <span className="truncate text-xs text-yt-secondary transition hover:text-white">
                                {channelName}
                              </span>
                            </Link>
                          ) : null}
                          <p className="mt-0.5 text-xs text-yt-secondary/80">
                            {formatViews(item.views)} • {formatRelativeDate(item.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </aside>
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

      <SavePlaylistModal
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        video={
          video
            ? { _id: video._id, title: video.title, thumbnailUrl: video.thumbnailUrl, videoUrl: video.videoUrl }
            : null
        }
      />

      <EditVideoModal
        open={editOpen}
        video={video}
        onClose={() => setEditOpen(false)}
        onSaved={handleVideoSaved}
      />
    </main>
  );
}
