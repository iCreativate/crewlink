"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  src: string;
  className?: string;
};

export function LazyVideo({ src, className }: Props) {
  const elRef = useRef<HTMLVideoElement | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e) return;
        if (e.isIntersecting) {
          setEnabled(true);
          io.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={elRef}
      src={enabled ? src : undefined}
      data-src={src}
      className={className}
      preload="none"
      controls
      muted
      playsInline
    />
  );
}

