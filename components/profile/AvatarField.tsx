"use client";

import Image from "next/image";
import { useRef, useState } from "react";

type Props = {
  imageUrl: string | null;
  displayName: string;
  onUploaded: (url: string) => void;
};

export function AvatarField({ imageUrl, displayName, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload/avatar", { method: "POST", body: fd });
    const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
    setUploading(false);
    if (!res.ok) {
      setError(data.error || "Upload failed");
      return;
    }
    if (data.url) onUploaded(data.url);
  }

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-white bg-zinc-100 shadow-lg ring-1 ring-zinc-200/80 dark:border-zinc-900 dark:bg-zinc-800 dark:ring-zinc-700">
        {imageUrl ? (
          <Image src={imageUrl} alt="" fill className="object-cover" sizes="112px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-zinc-400">
            {(displayName[0] ?? "?").toUpperCase()}
          </div>
        )}
        {uploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-medium text-white">
            …
          </div>
        ) : null}
      </div>
      <div className="text-center sm:text-left">
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFile} />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          Change photo
        </button>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">JPG, PNG or WebP · max 5MB</p>
        {error ? <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p> : null}
      </div>
    </div>
  );
}
