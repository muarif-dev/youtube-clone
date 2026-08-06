"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import { Bell, ChevronDown, CircleCheck, Radio } from "lucide-react";
import {
  formatCount,
  formatDuration,
  formatRelativeDate,
  channelDisplayName,
  isShortContent,
  viewCount,
} from "@/lib/video";

interface IUserProfile {
  _id: string;
  name: string;
  channelName?: string;
  image?: string;
  subscribers?: number;
}

interface IVideo {
  _id: string;
  title: string;
  thumbnailUrl: string;
  views: number;
  type: "video" | "short";
  duration?: number | string;
  createdAt: string;
  userId?: IUserProfile;
}

interface ISubscribedChannel {
  _id: string;
  name: string;
  avatar?: string;
}

export default function SubscriptionsPage() {
  const { data: session, status } = useSession();
  const authenticated = status === "authenticated" && Boolean(session?.user?.id);

  const [videos, setVideos] = useState<IVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const [subscribed, setSubscribed] = useState<ISubscribedChannel[]>([]);

  const [lastVisited, setLastVisited] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("subscriptionsLastVisited");
  });

  useEffect(() => {
    let cancelled = false;
    async function fetchSubscriptions() {
      if (!authenticated) {
        setVideos([]);
        setSubscribed([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/subscriptions`);
        const data = await res.json();
        if (cancelled) return;
        if (res.ok) {
          const channels: ISubscribedChannel[] = Array.isArray(data.channels) ? data.channels : [];
          const rawVideos: IVideo[] = Array.isArray(data.videos) ? data.videos : [];
          const selfId = session?.user?.id ? String(session.user.id) : null;
          const subscribedIds = new Set(channels.map((channel) => channel._id));
          const filtered = rawVideos.filter((video) => {
            const uid = video.userId?._id;
            if (!uid) return false;
            if (selfId && uid === selfId && !subscribedIds.has(uid)) return false;
            return true;
          });
          setSubscribed(channels);
          setVideos(filtered);
          try {
            window.localStorage.setItem("subscribedChannels", JSON.stringify(channels));
          } catch {
            // ignore storage errors
          }
        } else {
          setVideos([]);
          setSubscribed([]);
        }
      } catch (err) {
        console.error("Error fetching subscription videos:", err);
        setVideos([]);
        setSubscribed([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchSubscriptions();
    return () => {
      cancelled = true;
    };
  }, [authenticated, session?.user?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const timer = setTimeout(() => {
      const existing = window.localStorage.getItem("subscriptionsLastVisited");
      if (existing) {
        setLastVisited(existing);
      } else {
        window.localStorage.setItem("subscriptionsLastVisited", new Date().toISOString());
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const unreadByChannel = useMemo(() => {
    const seen = lastVisited ? new Date(lastVisited).getTime() : 0;
    const result: Record<string, boolean> = {};
    for (const video of videos) {
      const uid = video.userId?._id;
      if (!uid) continue;
      if (result[uid] === undefined) {
        result[uid] = new Date(video.createdAt).getTime() > seen;
      }
    }
    return result;
  }, [videos, lastVisited]);

  const feedVideos = useMemo(() => {
    const ids = new Set(subscribed.map((channel) => channel._id));
    return videos.filter((video) => {
      const uid = video.userId?._id;
      if (!uid || !ids.has(uid)) return false;
      if (selectedChannelId && uid !== selectedChannelId) return false;
      if (isShortContent(video)) return false;
      return true;
    });
  }, [videos, subscribed, selectedChannelId]);

  const selectedChannel = subscribed.find((channel) => channel._id === selectedChannelId) || null;
  const selectedChannelSubs =
    videos.find((video) => video.userId?._id === selectedChannelId)?.userId?.subscribers ?? 0;

  const unsubscribe = async (channel: ISubscribedChannel) => {
    try {
      await fetch(`/api/channels/${channel._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unsubscribe" }),
      });
    } catch {
      // ignore API errors
    }
    setSubscribed((current) => {
      const next = current.filter((item) => item._id !== channel._id);
      try {
        window.localStorage.setItem("subscribedChannels", JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
    setVideos((current) => current.filter((video) => video.userId?._id !== channel._id));
    if (selectedChannelId === channel._id) {
      setSelectedChannelId(null);
    }
  };

  return (
    <main className="min-h-screen bg-yt-bg px-4 pb-24 text-white sm:px-6 md:pb-10 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-yt-card">
            <Bell className="h-5 w-5 text-white" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-white">Subscriptions</h1>
            <p className="text-sm text-yt-secondary">{formatCount(subscribed.length)} channels</p>
          </div>
        </div>

        {status === "loading" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 16 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-xl bg-yt-card">
                <div className="aspect-video w-full animate-pulse bg-gray-700/80" />
                <div className="flex gap-3 p-3">
                  <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-gray-700/80" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 w-4/5 animate-pulse rounded bg-gray-700/80" />
                    <div className="h-3 w-3/5 animate-pulse rounded bg-gray-700/80" />
                    <div className="h-3 w-2/5 animate-pulse rounded bg-gray-700/80" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !authenticated ? (
          <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
            <div className="mx-auto mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-yt-card">
              <Bell className="h-12 w-12 text-yt-secondary" />
            </div>
            <h2 className="text-2xl font-semibold text-white">Sign in to see your subscriptions</h2>
            <p className="mt-3 text-yt-secondary">
              Your subscribed channels and their latest uploads will appear here once you sign in.
            </p>
            <button
              type="button"
              onClick={() => signIn()}
              className="mt-8 inline-flex rounded-full bg-yt-red px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#CC0000]"
            >
              Sign In
            </button>
          </div>
        ) : (
          <>
            <div className="border-b border-yt-border pb-4">
          <div className="flex gap-5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setSelectedChannelId(null)}
              className="flex w-16 shrink-0 flex-col items-center gap-1.5"
            >
              <span
                className={`inline-flex items-center justify-center rounded-full p-0.5 transition ${
                  selectedChannelId === null ? "bg-white" : "bg-transparent"
                }`}
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-yt-card">
                  <Radio className="h-6 w-6 text-yt-secondary" />
                </span>
              </span>
              <span
                className={`w-full truncate text-center text-xs ${
                  selectedChannelId === null ? "text-white" : "text-yt-secondary"
                }`}
              >
                All
              </span>
            </button>

            {subscribed.map((channel) => {
              const isSelected = selectedChannelId === channel._id;
              const isUnread = unreadByChannel[channel._id] === true;
              return (
                <button
                  key={channel._id}
                  type="button"
                  onClick={() => setSelectedChannelId(isSelected ? null : channel._id)}
                  className="flex w-16 shrink-0 flex-col items-center gap-1.5"
                >
                  <span
                    className={`rounded-full p-0.5 transition ${
                      isSelected ? "bg-white" : isUnread ? "bg-yt-red" : "bg-transparent"
                    }`}
                  >
                    <img
                      src={
                        channel.avatar ||
                        `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(channel.name)}&backgroundType=gradientLinear&colors=red,black,slate`
                      }
                      alt={channel.name}
                      className="h-12 w-12 rounded-full bg-yt-hover object-cover"
                    />
                  </span>
                  <span
                    className={`w-full truncate text-center text-xs ${
                      isSelected ? "text-white" : "text-yt-secondary"
                    }`}
                  >
                    {channel.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {selectedChannel && (
          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-yt-border bg-yt-card p-4">
            <img
              src={
                selectedChannel.avatar ||
                `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(selectedChannel.name)}&backgroundType=gradientLinear&colors=red,black,slate`
              }
              alt={selectedChannel.name}
              className="h-14 w-14 rounded-full bg-yt-hover object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-semibold text-white">{selectedChannel.name}</p>
              <p className="text-sm text-yt-secondary">
                {formatCount(selectedChannelSubs)} subscribers
              </p>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuFor(menuFor === selectedChannel._id ? null : selectedChannel._id)}
                className="inline-flex items-center gap-1 rounded-full bg-yt-hover px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/15"
              >
                <CircleCheck className="h-5 w-5" />
                Subscribed
                <ChevronDown className="h-4 w-4" />
              </button>
              {menuFor === selectedChannel._id && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuFor(null)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 z-20 mt-2 w-52 rounded-lg border border-yt-border bg-yt-card py-1 shadow-2xl">
                    <button
                      type="button"
                      onClick={() => {
                        unsubscribe(selectedChannel);
                        setMenuFor(null);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-white transition hover:bg-yt-hover"
                    >
                      Unsubscribe
                    </button>
                    <button
                      type="button"
                      onClick={() => setMenuFor(null)}
                      className="w-full px-4 py-2.5 text-left text-sm text-white transition hover:bg-yt-hover"
                    >
                      Manage subscription
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 16 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-xl bg-yt-card">
                <div className="aspect-video w-full animate-pulse bg-gray-700/80" />
                <div className="flex gap-3 p-3">
                  <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-gray-700/80" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 w-4/5 animate-pulse rounded bg-gray-700/80" />
                    <div className="h-3 w-3/5 animate-pulse rounded bg-gray-700/80" />
                    <div className="h-3 w-2/5 animate-pulse rounded bg-gray-700/80" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : subscribed.length === 0 ? (
          <div className="mx-auto max-w-md py-16 text-center">
            <div className="mx-auto mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-yt-card">
              <Bell className="h-12 w-12 text-yt-secondary" />
            </div>
            <h2 className="text-2xl font-semibold text-white">You haven&apos;t subscribed to any channels yet</h2>
            <p className="mt-3 text-yt-secondary">
              When you subscribe to channels, their latest uploads will appear here.
            </p>
            <Link
              href="/"
              className="mt-8 inline-flex rounded-full bg-yt-red px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#CC0000]"
            >
              Find channels to watch
            </Link>
          </div>
        ) : feedVideos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-yt-border bg-yt-card p-12 text-center text-yt-secondary">
            No uploads from {selectedChannel ? selectedChannel.name : "your subscriptions"} yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {feedVideos.map((video) => {
              const channel = video.userId;
              const duration = formatDuration(video.duration);
              return (
                <div
                  key={video._id}
                  className="group overflow-hidden rounded-xl bg-yt-card transition hover:bg-yt-hover"
                >
                  <div className="relative overflow-hidden">
                    <Link href={`/watch/${video._id}`}>
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="aspect-video w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    </Link>
                    {duration && (
                      <span className="absolute right-2 bottom-2 rounded-sm bg-black/80 px-1.5 py-0.5 text-[11px] font-medium text-white">
                        {duration}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3 p-3">
                    <Link href={`/channel/${channel?._id}`} className="shrink-0">
                      <img
                        src={
                          channel?.image ||
                          `https://api.dicebear.com/6.x/initials/svg?seed=${encodeURIComponent(channelDisplayName(channel))}&backgroundType=gradientLinear&colors=red,black,slate`
                        }
                        alt={channelDisplayName(channel)}
                        className="h-9 w-9 shrink-0 rounded-full bg-yt-hover object-cover transition hover:opacity-80"
                      />
                    </Link>
                    <div className="min-w-0">
                      <Link href={`/watch/${video._id}`}>
                        <h2 className="line-clamp-2 text-sm font-medium text-white transition group-hover:text-yt-red">
                          {video.title}
                        </h2>
                      </Link>
                      <Link href={`/channel/${channel?._id}`}>
                        <p className="mt-1 text-xs text-yt-secondary transition hover:text-white">
                          {channelDisplayName(channel)}
                        </p>
                      </Link>
                      <p className="mt-1 text-xs text-yt-secondary/80">
                        {formatCount(viewCount(video.views))} views • {formatRelativeDate(video.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
          </>
        )}
      </div>
    </main>
  );
}
