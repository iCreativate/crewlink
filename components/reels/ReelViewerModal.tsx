"use client";

import Image from "next/image";
import { useEffect } from "react";
import { LazyVideo } from "@/components/portfolio/LazyVideo";

export type ReelMedia = {
  url: string;
  mediaType: "VIDEO" | "IMAGE";
  title?: string | null;
  subtitle?: string | null;
};

export function ReelViewerModal({
  open,
  onClose,
  media,
}: {
  open: boolean;
  onClose: () => void;
  media: ReelMedia | null;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, open]);

  if (!open || !media) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/55 p-3 backdrop-blur sm:items-center">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-[520px] overflow-hidden rounded-[28px] bg-zinc-950 ring-1 ring-white/10 shadow-2xl">
        <div className="flex items-start justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{media.title ?? "Reel"}</p>
            {media.subtitle ? <p className="mt-1 truncate text-xs text-zinc-300">{media.subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
          >
            Close
          </button>
        </div>

        <div className="relative aspect-[9/16] w-full bg-black">
          {media.mediaType === "VIDEO" ? (
            <LazyVideo src={media.url} className="h-full w-full object-cover" />
          ) : (
            <Image
              src={media.url}
              alt={media.title ?? "Reel"}
              fill
              unoptimized
              className="object-cover"
              sizes="520px"
            />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />
        </div>
      </div>
    </div>
  );
}

