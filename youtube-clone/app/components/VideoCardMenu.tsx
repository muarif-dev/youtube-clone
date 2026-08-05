"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Clock3, Heart, ListMusic, MoreVertical, Music, Plus } from "lucide-react";
import { PLAYLISTS, PLAYLIST_IDS, type PlaylistId, type PlaylistSource } from "@/lib/playlists";
import { usePlaylists } from "./PlaylistProvider";
import { useToast } from "./ToastProvider";

interface VideoCardMenuProps {
  video: PlaylistSource;
}

interface MenuPosition {
  top: number;
  left: number;
}

const MENU_WIDTH = 264;
const MENU_MAX_HEIGHT = 360;

const SUCCESS_MESSAGES: Record<PlaylistId, string> = {
  watchLater: "Saved to Watch Later",
  favorites: "Added to My Favorites",
  musicMix: "Added to Music Mix",
};

export default function VideoCardMenu({ video }: VideoCardMenuProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const showToast = useToast();
  const { ready, isMember, saveToPlaylist, removeFromPlaylist } = usePlaylists();
  const [open, setOpen] = useState(false);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition | null>(null);

  useEffect(() => {
    if (!open) return;
    const close = () => {
      setOpen(false);
      setPlaylistOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const openMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (open) {
      setOpen(false);
      return;
    }
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const left = Math.min(Math.max(rect.right - MENU_WIDTH, 8), window.innerWidth - MENU_WIDTH - 8);
    const top = Math.min(rect.bottom + 6, Math.max(8, window.innerHeight - MENU_MAX_HEIGHT - 8));
    setPosition({ top, left });
    setPlaylistOpen(false);
    setOpen(true);
  };

  const addTo = async (playlistId: PlaylistId) => {
    console.log(`VideoCardMenu: saving "${video.title}" to ${playlistId}`);
    if (isMember(video._id, playlistId)) {
      showToast(`Already in ${PLAYLISTS[playlistId].label}`);
      return;
    }
    const ok = await saveToPlaylist(video, playlistId);
    showToast(ok ? SUCCESS_MESSAGES[playlistId] : "Failed to save video");
  };

  const toggleIn = async (playlistId: PlaylistId) => {
    console.log(`VideoCardMenu: toggling "${video.title}" in ${playlistId}`);
    const currentlyIn = isMember(video._id, playlistId);
    if (currentlyIn) {
      const ok = await removeFromPlaylist(video._id, playlistId);
      showToast(ok ? `Removed from ${PLAYLISTS[playlistId].label}` : "Failed to update playlist");
    } else {
      const ok = await saveToPlaylist(video, playlistId);
      showToast(ok ? `Saved to ${PLAYLISTS[playlistId].label}` : "Failed to save video");
    }
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={openMenu}
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/60 transition hover:bg-yt-hover hover:text-white"
        aria-label="More options"
        aria-expanded={open}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && position && typeof document !== "undefined"
        ? createPortal(
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setOpen(false);
                  setPlaylistOpen(false);
                }}
                aria-hidden="true"
              />
              <div
                role="menu"
                className="menu-enter fixed z-50 overflow-hidden rounded-lg border border-yt-border bg-[#282828] py-1.5 shadow-2xl"
                style={{ top: position.top, left: position.left, width: MENU_WIDTH, maxHeight: MENU_MAX_HEIGHT }}
                onMouseDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => addTo("watchLater")}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-white transition hover:bg-[#3D3D3D]"
                >
                  <Clock3 className="h-4 w-4 shrink-0 text-white" />
                  Save to Watch Later
                  {ready && isMember(video._id, "watchLater") && <Check className="ml-auto h-4 w-4 text-yt-red" />}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => addTo("favorites")}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-white transition hover:bg-[#3D3D3D]"
                >
                  <Heart className="h-4 w-4 shrink-0 text-white" />
                  Add to Favorites
                  {ready && isMember(video._id, "favorites") && <Check className="ml-auto h-4 w-4 text-yt-red" />}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => addTo("musicMix")}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-white transition hover:bg-[#3D3D3D]"
                >
                  <Music className="h-4 w-4 shrink-0 text-white" />
                  Add to Music Mix
                  {ready && isMember(video._id, "musicMix") && <Check className="ml-auto h-4 w-4 text-yt-red" />}
                </button>

                <div className="my-1.5 h-px bg-yt-border" />

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => setPlaylistOpen((current) => !current)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-white transition hover:bg-[#3D3D3D]"
                >
                  <ListMusic className="h-4 w-4 shrink-0 text-white" />
                  Save to playlist
                  <Plus
                    className={`ml-auto h-4 w-4 shrink-0 transition-transform ${playlistOpen ? "rotate-45" : ""}`}
                  />
                </button>

                {playlistOpen && (
                  <div className="border-t border-yt-border pt-1">
                    {PLAYLIST_IDS.map((playlistId) => {
                      const inPlaylist = ready && isMember(video._id, playlistId);
                      return (
                        <button
                          key={playlistId}
                          type="button"
                          role="menuitemcheckbox"
                          aria-checked={inPlaylist}
                          onClick={() => toggleIn(playlistId)}
                          className="flex w-full items-center gap-3 px-4 py-2.5 pl-9 text-left text-sm text-[#F1F1F1] transition hover:bg-[#3D3D3D]"
                        >
                          <span
                            className={`inline-flex h-4 w-4 items-center justify-center rounded-sm border transition ${
                              inPlaylist ? "border-yt-red bg-yt-red" : "border-[#5F5F5F]"
                            }`}
                          >
                            {inPlaylist && <Check className="h-3 w-3 text-white" />}
                          </span>
                          {PLAYLISTS[playlistId].label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>,
            document.body
          )
        : null}
    </>
  );
}
