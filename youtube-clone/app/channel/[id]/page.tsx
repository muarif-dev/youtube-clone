"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { CalendarDays, Pencil, Users } from "lucide-react";
import { ChannelHeaderSkeleton } from "../../components/Skeletons";
import { useToast } from "../../components/ToastProvider";
import {
  channelDisplayName,
  formatCount,
  formatDuration,
  formatRelativeDate,
  formatViews,
} from "@/lib/video";

interface IUserProfile {
  _id: string;
  name: string;
  channelName?: string;
  image?: string;
  bio?: string;
  createdAt?: string;
  subscribers?: string[] | number;
  subscribedTo?: string[];
  subscribersCount?: number;
}

interface IVideo {
  _id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  views: number | unknown[];
  duration?: number | string;
  createdAt: string;
}

const tabs = ["Home", "Videos", "About"];

function getSubscriberCount(user: IUserProfile | null | undefined, fallbackCount?: unknown): number {
  if (!user) {
    const fallback = Number(fallbackCount);
    return Number.isFinite(fallback) ? fallback : 0;
  }
  if (Array.isArray(user.subscribers)) return user.subscribers.length;
  if (Array.isArray(user.subscribedTo)) return user.subscribedTo.length;
  if (typeof user.subscribersCount === "number" && Number.isFinite(user.subscribersCount)) {
    return user.subscribersCount;
  }
  if (typeof user.subscribers === "number" && Number.isFinite(user.subscribers)) {
    return user.subscribers;
  }
  const fallback = Number(fallbackCount);
  return Number.isFinite(fallback) ? fallback : 0;
}

export default function ChannelPublicPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const { data: session } = useSession();
  const showToast = useToast();

  const [channel, setChannel] = useState<IUserProfile | null>(null);
  const [videos, setVideos] = useState<IVideo[]>([]);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [activeTab, setActiveTab] = useState("Home");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function fetchChannel() {
      try {
        const res = await fetch(`/api/channels/${id}`);
        const data = await res.json();
        if (!res.ok) {
          if (!cancelled) setError(data.error || "Channel not found");
          return;
        }
        if (cancelled) return;
        setChannel(data.user);
        setVideos(Array.isArray(data.videos) ? data.videos : []);
        setSubscriberCount(getSubscriberCount(data.user, data.subscriberCount));
        setSubscribed(Boolean(data.subscribed));
        setIsOwner(Boolean(data.isOwner));
      } catch {
        if (!cancelled) setError("Unable to load this channel.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchChannel();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSubscribe = async () => {
    if (!id) return;
    if (!session?.user?.id) {
      showToast("Sign in to subscribe");
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/channels/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: subscribed ? "unsubscribe" : "subscribe" }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubscribed(Boolean(data.subscribed));
        const count = Number(data.subscriberCount);
        setSubscriberCount(Number.isFinite(count) ? count : 0);
        showToast(data.subscribed ? "Subscribed to channel" : "Unsubscribed");
      } else {
        showToast(data.error || "Unable to update subscription");
      }
    } catch {
      showToast("Unable to update subscription");
    } finally {
      setBusy(false);
    }
  };

  const displayName = channelDisplayName(channel);
  const latestVideo = videos[0];
  const channelHref = id ? `/channel/${id}` : "/";

  const renderVideoGrid = (items: IVideo[]) => (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((video) => {
        const duration = formatDuration(video.duration);
        return (
          <article
            key={video._id}
            className="group overflow-hidden rounded-2xl border border-yt-border bg-yt-card transition hover:bg-yt-hover"
          >
            <Link href={`/watch/${video._id}`} className="relative block aspect-video w-full overflow-hidden bg-yt-hover">
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              />
              {duration ? (
                <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
                  {duration}
                </span>
              ) : null}
            </Link>
            <div className="p-4">
              <Link href={`/watch/${video._id}`}>
                <h2 className="line-clamp-2 text-base font-semibold text-white">{video.title}</h2>
              </Link>
              <p className="mt-1 text-sm text-yt-secondary line-clamp-2">{video.description}</p>
              <p className="mt-3 text-xs text-yt-secondary">
                {formatViews(video.views)} • {formatRelativeDate(video.createdAt)}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );

  const renderEmptyVideos = () => (
    <div className="rounded-2xl border border-dashed border-yt-border bg-yt-card p-12 text-center text-yt-secondary">
      This channel hasn&apos;t uploaded any videos yet.
    </div>
  );

  const safeSubscriberCount =
    Array.isArray(channel?.subscribers)
      ? channel.subscribers.length
      : typeof channel?.subscribers === "number"
        ? channel.subscribers
        : 0;

  return (
    <main className="min-h-screen bg-yt-bg px-4 pb-24 text-white sm:px-6 md:pb-10 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {loading ? (
          <ChannelHeaderSkeleton />
        ) : error ? (
          <div className="rounded-2xl border border-yt-red bg-yt-card p-12 text-center text-red-300">
            <p className="text-lg font-semibold">{error}</p>
            <Link
              href="/"
              className="mt-4 inline-flex rounded-full bg-yt-red px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#CC0000]"
            >
              Back to Home
            </Link>
          </div>
        ) : channel ? (
          <>
            <div className="relative overflow-hidden rounded-2xl border border-yt-border bg-yt-card">
              <div className="relative h-40 bg-[radial-gradient(circle_at_top,_rgba(255,0,0,0.18),_transparent_60%),linear-gradient(180deg,#212121,#0f0f0f)]">
                <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-yt-bg/95 via-yt-bg/40 to-transparent" />
              </div>

              <div className="space-y-6 p-6 sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-yt-card bg-yt-hover">
                      <img
                        src={
                          channel.image ||
                          `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundType=gradientLinear&colors=red,black,slate`
                        }
                        alt={displayName}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-yt-red">Channel</p>
                      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">{displayName}</h1>
                      <p className="mt-1 text-sm text-yt-secondary">
                        {safeSubscriberCount.toLocaleString()}{" "}
                        subscribers
                        {videos.length > 0 ? ` • ${formatCount(videos.length)} videos` : ""}
                      </p>
                    </div>
                  </div>

                  {isOwner ? (
                    <Link
                      href="/channel"
                      className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/85"
                    >
                      <Pencil className="h-4 w-4" />
                      Manage Channel
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubscribe}
                      disabled={busy}
                      className={`rounded-full px-6 py-2.5 text-sm font-semibold transition ${
                        subscribed
                          ? "bg-yt-hover text-white hover:bg-white/15"
                          : "bg-yt-red text-white hover:bg-[#CC0000]"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      {subscribed ? "Subscribed" : "Subscribe"}
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        activeTab === tab
                          ? "bg-white text-black"
                          : "bg-yt-hover text-[#F1F1F1] hover:bg-white/20"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {activeTab === "Home" && (
              <div className="space-y-8">
                {latestVideo ? (
                  <section>
                    <p className="text-lg font-semibold text-white">Latest upload</p>
                    <div className="mt-4 overflow-hidden rounded-2xl border border-yt-border bg-black">
                      <video
                        controls
                        poster={latestVideo.thumbnailUrl}
                        src={latestVideo.videoUrl}
                        className="aspect-video w-full bg-black object-contain"
                      />
                    </div>
                  </section>
                ) : null}

                <section className="space-y-4">
                  <p className="text-lg font-semibold text-white">Videos</p>
                  {videos.length === 0 ? renderEmptyVideos() : renderVideoGrid(videos)}
                </section>
              </div>
            )}

            {activeTab === "Videos" && (
              <section className="space-y-4">
                <div>
                  <p className="text-lg font-semibold text-white">Uploaded Videos</p>
                  <p className="text-sm text-yt-secondary">Latest uploads from this channel.</p>
                </div>
                {videos.length === 0 ? renderEmptyVideos() : renderVideoGrid(videos)}
              </section>
            )}

            {activeTab === "About" && (
              <div className="space-y-4">
                <p className="text-lg font-semibold text-white">About</p>
                <p className="text-sm leading-7 text-yt-secondary">
                  {channel.bio || "This creator hasn&apos;t added a bio yet."}
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-yt-border bg-yt-card p-5">
                    <p className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-yt-secondary">
                      <Users className="h-4 w-4" />
                      Subscribers
                    </p>
                    <p className="mt-2 text-sm text-white">
                      {safeSubscriberCount.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-yt-border bg-yt-card p-5">
                    <p className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-yt-secondary">
                      <CalendarDays className="h-4 w-4" />
                      Joined
                    </p>
                    <p className="mt-2 text-sm text-white">
                      {channel.createdAt ? formatRelativeDate(channel.createdAt) : "Recently"}
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-yt-border bg-yt-card p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-yt-secondary">Channel</p>
                  <p className="mt-2 text-sm text-white">{displayName}</p>
                  <Link
                    href={channelHref}
                    className="mt-4 inline-block rounded-full bg-yt-hover px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                  >
                    {isOwner ? "Your Channel" : "Visit Channel"}
                  </Link>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </main>
  );
}
