"use client";

import Image from "next/image";

function isSvg(src: string) {
  return src.toLowerCase().split("?")[0]?.endsWith(".svg");
}

export function Avatar({
  name,
  src,
  size = 42,
  className = "",
}: {
  name?: string | null;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const initial = (name ?? "C")[0]?.toUpperCase() ?? "C";

  if (src) {
    return (
      <span
        className={["relative inline-block overflow-hidden rounded-full", className].filter(Boolean).join(" ")}
        style={{ width: size, height: size }}
      >
        {isSvg(src) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <Image src={src} alt="" fill className="object-cover" sizes={`${size}px`} />
        )}
      </span>
    );
  }

  return (
    <span
      className={["avatar", "inline-flex items-center justify-center", className].filter(Boolean).join(" ")}
      style={{ width: size, height: size }}
    >
      {initial}
    </span>
  );
}

