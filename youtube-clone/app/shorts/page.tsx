"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  Share2,
  SquarePlay,
  ThumbsDown,
  ThumbsUp,
  Upload,
  Volume2,
  VolumeX,
} from "lucide-react";
import UploadModal from "../components/UploadModal";
import { ShortsFeedSkeleton } from "../components/Skeletons";
import { useToast } from "../components/ToastProvider";
import {
  channelDisplayName,
  formatCount,
  formatRelativeDate,
  isShortContent,
  viewCount,
} from "@/lib/video";

interface IUserProfile {
  _id: string;
  name: string;
  channelName?: string;
  image?: string;
}

interface IShort {
  _id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl: string;
  views: unknown;
  likes: number;
  dislikes?: number;
  createdAt: string;
  type?: "video" | "short";
  duration?: number | string;
  userId?: IUserProfile;
  liked?: boolean;
  disliked?: boolean;
}

type ReactionState = Record<string, { liked: boolean; disliked: boolean; likes: number; dislikes: number }>;

export default function ShortsPage() {
  const { data: session } = useSession();
  const showToast = useToast();

  const [shorts, setShorts] = useState<IShort[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [reactions, setReactions] = useState<ReactionState>({});
  const [muted, setMuted] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const videoEls = useRef<Map<string, HTMLVideoElement>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollShorts = (direction: "up" | "down") => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const step = container.clientHeight * 0.9;
    container.scrollBy({ top: direction === "up" ? -step : step, behavior: "smooth" });
  };

  useEffect(() => {
    async function fetchShorts() {
      try {
        const res = await fetch(`/api/videos?type=short`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.videos || [];
        setShorts(list.filter((short: IShort) => isShortContent(short)));
      } catch (err) {
        console.error("Error fetching shorts:", err);
        setShorts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchShorts();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement;
          const id = (entry.target as HTMLElement).dataset.shortId;
          if (entry.isIntersecting) {
            if (id) setMuted((current) => ({ ...current, [id]: false }));
            video.muted = false;
            video.play().catch(() => {
              video.muted = true;
              if (id) setMuted((current) => ({ ...current, [id]: true }));
              video.play().catch(() => {});
            });
          } else {
            video.pause();
            video.currentTime = 0;
          }
        });
      },
      { threshold: 0.7 }
    );

    videoEls.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [shorts]);

  const setVideoRef = (id: string) => (el: HTMLVideoElement | null) => {
    if (el) {
      videoEls.current.set(id, el);
    } else {
      videoEls.current.delete(id);
    }
  };

  const toggleReaction = async (short: IShort, action: "like" | "dislike") => {
    if (!session?.user?.id) {
      showToast("Sign in to react to shorts");
      return;
    }
    if (busy[short._id]) return;
    setBusy((current) => ({ ...current, [short._id]: true }));
    try {
      const endpoint = action === "dislike" ? "dislike" : "like";
      const res = await fetch(`/api/videos/${short._id}/${endpoint}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) {
        setReactions((current) => ({
          ...current,
          [short._id]: {
            liked: Boolean(data.isLiked ?? data.liked),
            disliked: Boolean(data.isDisliked ?? data.disliked),
            likes: data.likesCount ?? data.likes ?? 0,
            dislikes: data.dislikesCount ?? data.dislikes ?? 0,
          },
        }));
      } else {
        showToast(data.error || "Unable to update reaction");
      }
    } catch {
      showToast("Unable to update reaction");
    } finally {
      setBusy((current) => ({ ...current, [short._id]: false }));
    }
  };

  const shareShort = async (short: IShort) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/watch/${short._id}`);
      showToast("Link copied to clipboard");
    } catch {
      showToast("Could not copy the link.");
    }
  };

  const renderActionButton = (
    label: string,
    icon: ReactNode,
    active: boolean,
    onClick: () => void,
    count?: number
  ) => (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center gap-1"
      aria-label={label}
      aria-pressed={active}
    >
      <span
        className={`inline-flex h-12 w-12 items-center justify-center rounded-full transition ${
          active ? "bg-yt-red text-white" : "bg-yt-hover text-white group-hover:bg-white/15"
        }`}
      >
        {icon}
      </span>
      {count !== undefined ? (
        <span className="text-xs font-medium text-yt-secondary">{formatCount(count)}</span>
      ) : (
        <span className="text-xs font-medium text-yt-secondary">{label}</span>
      )}
    </button>
  );

  return (
    <main className="no-scrollbar relative -mt-16 flex h-[calc(100vh-56px)] flex-col overflow-hidden bg-yt-bg text-white md:-mt-6">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-yt-card text-white">
            <SquarePlay className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-white">Shorts</h1>
            <p className="mt-1 text-sm text-yt-secondary">Vertical videos from the community, one at a time.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-yt-red px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#CC0000]"
        >
          <Upload className="h-5 w-5" />
          Upload Short
        </button>
      </header>

      <div
        ref={scrollContainerRef}
        className="h-[calc(100vh-56px)] min-h-0 flex-1 overflow-y-scroll snap-y snap-mandatory overscroll-contain scroll-smooth scrollbar-none [ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {loading ? (
          <div className="mx-auto flex h-full w-full max-w-4xl flex-col items-center justify-center px-1 py-2">
            <ShortsFeedSkeleton />
          </div>
        ) : shorts.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6">
            <div className="mx-auto max-w-md text-center">
              <div className="mx-auto mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-yt-card">
                <SquarePlay className="h-12 w-12 text-yt-secondary" />
              </div>
              <h2 className="text-2xl font-semibold text-white">No Shorts found.</h2>
              <p className="mt-3 text-yt-secondary">Upload vertical videos under 60 seconds!</p>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-yt-red px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#CC0000]"
              >
                <Upload className="h-5 w-5" />
                Upload Short
              </button>
            </div>
          </div>
        ) : (
          <>
            {shorts.map((short, index) => {
              const channel = short.userId as IUserProfile | undefined;
              const displayName = channelDisplayName(channel);
              const reaction = reactions[short._id];
              const isLiked = reaction ? reaction.liked : Boolean(short.liked);
              const isDisliked = reaction ? reaction.disliked : Boolean(short.disliked);
              const likeCount = reaction ? reaction.likes : short.likes ?? 0;
              const dislikeCount = reaction ? reaction.dislikes : short.dislikes ?? 0;
              const isMuted = muted[short._id] !== false;

              return (
                <section
                  key={short._id}
                  className="flex h-full snap-start items-center justify-center px-1 py-2"
                >
                  <div className="mx-auto flex w-full max-w-4xl items-center justify-center gap-4 md:gap-6">
                    <div className="relative aspect-[9/16] h-full max-h-full w-full max-w-[300px] shrink-0 overflow-hidden rounded-2xl bg-black sm:max-w-[340px]">
                      <video
                        ref={setVideoRef(short._id)}
                        data-short-id={short._id}
                        src={short.videoUrl}
                        poster={short.thumbnailUrl}
                        muted={isMuted}
                        loop
                        playsInline
                        preload="metadata"
                        className="h-full w-full bg-black object-cover"
                      />
                      {index === 0 ? (
                        <span className="absolute left-3 top-3 rounded bg-black/70 px-2 py-1 text-[11px] font-semibold text-white">
                          Short
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() =>
                          setMuted((current) => ({ ...current, [short._id]: !isMuted }))
                        }
                        className="absolute bottom-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                        aria-label={isMuted ? "Unmute" : "Mute"}
                      >
                        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                      </button>
                    </div>

                    <div className="flex min-w-0 flex-col items-start justify-end gap-5 py-1">
                      <div className="flex items-center gap-2.5">
                        <Link href={`/channel/${channel?._id}`} className="shrink-0">
                          <img
                            src={
                              channel?.image ||
                              `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundType=gradientLinear&colors=red,black,slate`
                            }
                            alt={displayName}
                            className="h-9 w-9 rounded-full bg-yt-hover object-cover transition hover:opacity-80"
                          />
                        </Link>
                        <div className="min-w-0">
                          <Link href={`/channel/${channel?._id}`}>
                            <p className="truncate text-sm font-semibold text-white transition hover:text-yt-red">
                              {displayName}
                            </p>
                          </Link>
                          <p className="text-xs text-yt-secondary">{formatCount(viewCount(short.views))} views</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-5 md:flex-col md:items-end md:gap-4">
                        {renderActionButton(
                          "Like",
                          <ThumbsUp className="h-5 w-5" />,
                          isLiked,
                          () => toggleReaction(short, "like"),
                          likeCount
                        )}
                        {renderActionButton(
                          "Dislike",
                          <ThumbsDown className="h-5 w-5" />,
                          isDisliked,
                          () => toggleReaction(short, "dislike"),
                          dislikeCount
                        )}
                        {renderActionButton("Share", <Share2 className="h-5 w-5" />, false, () => shareShort(short))}
                      </div>

                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm font-medium text-white">{short.title}</p>
                        <p className="mt-1 text-xs text-yt-secondary">{formatRelativeDate(short.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </section>
              );
            })}

            <section className="flex h-full snap-start items-center justify-center px-4">
              <div className="text-center">
                <SquarePlay className="mx-auto h-12 w-12 text-yt-secondary" />
                <p className="mt-4 text-lg font-semibold text-white">No more shorts to show</p>
                <p className="mt-1 text-sm text-yt-secondary">You&apos;ve reached the end of the shorts feed.</p>
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-yt-hover px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  <Upload className="h-4 w-4" />
                  Upload a Short
                </button>
              </div>
            </section>
          </>
        )}
      </div>

      <div className="pointer-events-none absolute right-4 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-2 sm:right-6">
        <button
          type="button"
          onClick={() => scrollShorts("up")}
          aria-label="Previous short"
          className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full bg-yt-card/90 text-white shadow-lg backdrop-blur transition hover:bg-yt-hover"
        >
          <ChevronUp className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={() => scrollShorts("down")}
          aria-label="Next short"
          className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full bg-yt-card/90 text-white shadow-lg backdrop-blur transition hover:bg-yt-hover"
        >
          <ChevronDown className="h-6 w-6" />
        </button>
      </div>

      <UploadModal open={modalOpen} onClose={() => setModalOpen(false)} type="short" />
    </main>
  );
}
