export interface DurationSource {
  duration?: number | string | null;
}

export interface ShortDetectable {
  type?: string;
  isShort?: boolean;
  duration?: number | string | null;
}

export function formatDuration(seconds?: number | string | null): string {
  if (seconds === undefined || seconds === null || seconds === "") return "";
  const total = Number(seconds);
  if (!Number.isFinite(total) || total <= 0) return "";
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = Math.floor(total % 60);
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

export function isShortContent(video: ShortDetectable | null | undefined): boolean {
  if (!video) return false;
  if (video.isShort === true) return true;
  if (video.type === "short") return true;
  const duration = Number(video.duration);
  if (Number.isFinite(duration) && duration > 0 && duration < 60) return true;
  return false;
}

export function formatCount(count: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", compactDisplay: "short" }).format(count);
}

export function formatViews(views: number) {
  return `${formatCount(views)} views`;
}

export function formatRelativeDate(createdAt: string) {
  const diff = Date.now() - new Date(createdAt).getTime();
  const day = 1000 * 60 * 60 * 24;
  if (diff < day) return "Today";
  if (diff < day * 7) return `${Math.floor(diff / day)} days ago`;
  if (diff < day * 30) return `${Math.floor(diff / day / 7)} weeks ago`;
  if (diff < day * 365) return `${Math.floor(diff / day / 30)} months ago`;
  return `${Math.floor(diff / day / 365)} years ago`;
}

export function channelDisplayName(user?: { channelName?: string; name?: string } | null) {
  return user?.channelName || user?.name || "Creator";
}
