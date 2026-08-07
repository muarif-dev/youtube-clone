"use client";

export function VideoCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-yt-card">
      <div className="aspect-video w-full animate-pulse bg-yt-hover" />
      <div className="flex gap-3 p-3">
        <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-yt-hover" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-3 w-4/5 animate-pulse rounded bg-yt-hover" />
          <div className="h-3 w-3/5 animate-pulse rounded bg-yt-hover" />
          <div className="h-3 w-2/5 animate-pulse rounded bg-yt-hover" />
        </div>
      </div>
    </div>
  );
}

export function VideoGridSkeleton({ count = 16 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <VideoCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function WatchPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="aspect-video w-full animate-pulse rounded-2xl bg-yt-card" />
      <div className="rounded-2xl bg-yt-card p-5">
        <div className="h-5 w-3/4 animate-pulse rounded bg-yt-hover" />
        <div className="mt-5 flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-yt-hover" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 animate-pulse rounded bg-yt-hover" />
            <div className="h-3 w-1/5 animate-pulse rounded bg-yt-hover" />
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <div className="h-9 w-32 animate-pulse rounded-full bg-yt-hover" />
          <div className="h-9 w-28 animate-pulse rounded-full bg-yt-hover" />
          <div className="h-9 w-28 animate-pulse rounded-full bg-yt-hover" />
        </div>
      </div>
    </div>
  );
}

export function ChannelHeaderSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-yt-border bg-yt-card">
      <div className="h-40 animate-pulse bg-yt-hover" />
      <div className="p-6 sm:p-8">
        <div className="flex items-center gap-4">
          <div className="h-24 w-24 animate-pulse rounded-full bg-yt-hover" />
          <div className="flex-1 space-y-3">
            <div className="h-5 w-1/3 animate-pulse rounded bg-yt-hover" />
            <div className="h-3 w-1/4 animate-pulse rounded bg-yt-hover" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function RelatedVideoSkeleton() {
  return (
    <div className="flex gap-2 rounded-xl bg-yt-card p-2">
      <div className="aspect-video w-40 shrink-0 animate-pulse rounded-lg bg-yt-hover" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-3 w-4/5 animate-pulse rounded bg-yt-hover" />
        <div className="h-3 w-3/5 animate-pulse rounded bg-yt-hover" />
        <div className="h-3 w-2/5 animate-pulse rounded bg-yt-hover" />
      </div>
    </div>
  );
}

export function RelatedVideosSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <RelatedVideoSkeleton key={index} />
      ))}
    </div>
  );
}

export function ShortsFeedSkeleton() {
  return (
    <div className="relative aspect-[9/16] w-full max-w-[300px] animate-pulse overflow-hidden rounded-2xl bg-yt-card sm:max-w-[340px]">
      <div className="absolute inset-0 flex flex-col gap-4 p-6">
        <div className="h-6 w-24 rounded bg-yt-hover" />
        <div className="mt-auto space-y-3">
          <div className="h-4 w-3/4 rounded bg-yt-hover" />
          <div className="h-4 w-1/2 rounded bg-yt-hover" />
        </div>
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="h-16 animate-pulse rounded-xl bg-yt-card" />
      ))}
    </div>
  );
}

export function SearchResultRowSkeleton() {
  return (
    <div className="flex gap-4 rounded-xl bg-yt-card p-3">
      <div className="aspect-video w-40 shrink-0 animate-pulse rounded-lg bg-gray-700/80 sm:w-64" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-700/80" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-gray-700/80" />
        <div className="h-3 w-2/5 animate-pulse rounded bg-gray-700/80" />
        <div className="mt-2 h-3 w-3/5 animate-pulse rounded bg-gray-700/80" />
      </div>
    </div>
  );
}

export function SearchResultsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="mt-6 space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <SearchResultRowSkeleton key={index} />
      ))}
    </div>
  );
}
