"use client";

import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { LazyVideo } from "@/components/portfolio/LazyVideo";

function isSvg(src: string) {
  return src.toLowerCase().split("?")[0]?.endsWith(".svg");
}

export type MediaItem = { mediaType: "IMAGE" | "VIDEO"; url: string; sortOrder?: number };

export function MediaCarousel({
  items,
  onToggleExpandImage,
  expanded,
}: {
  items: MediaItem[];
  expanded: boolean;
  onToggleExpandImage: () => void;
}) {
  const normalized = useMemo(() => (Array.isArray(items) ? items.filter(Boolean) : []), [items]);
  const [idx, setIdx] = useState(0);
  const current = normalized[Math.min(idx, Math.max(0, normalized.length - 1))];

  const prev = useCallback(() => setIdx((i) => Math.max(0, i - 1)), []);
  const next = useCallback(() => setIdx((i) => Math.min(normalized.length - 1, i + 1)), [normalized.length]);

  if (!current) return null;

  const isImage = current.mediaType === "IMAGE";
  return (
    <div className="post-image bg-white/5">
      <div className="relative">
        {isImage ? (
          <button type="button" onClick={onToggleExpandImage} className="block w-full">
            <div className={["relative w-full", expanded ? "max-h-[78vh] min-h-[320px]" : "aspect-video"].join(" ")}>
              {isSvg(current.url) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={current.url}
                  alt=""
                  className={["h-full w-full", expanded ? "object-contain bg-black/30" : "object-cover"].join(" ")}
                />
              ) : (
                <Image
                  src={current.url}
                  alt="Post media"
                  width={1600}
                  height={1200}
                  className={["h-full w-full", expanded ? "object-contain bg-black/30" : "object-cover"].join(" ")}
                  sizes="(max-width: 720px) 100vw, 720px"
                />
              )}
            </div>
          </button>
        ) : (
          <div className="relative aspect-video w-full">
            <LazyVideo src={current.url} className="h-full w-full object-cover" />
          </div>
        )}

        {normalized.length > 1 ? (
          <>
            <button
              type="button"
              onClick={prev}
              disabled={idx === 0}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/45 px-3 py-2 text-xs font-semibold text-white ring-1 ring-white/10 backdrop-blur disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={next}
              disabled={idx === normalized.length - 1}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/45 px-3 py-2 text-xs font-semibold text-white ring-1 ring-white/10 backdrop-blur disabled:opacity-40"
            >
              Next
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1.5 text-[11px] font-semibold text-white ring-1 ring-white/10 backdrop-blur">
              {idx + 1} / {normalized.length}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

