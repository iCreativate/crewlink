"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GearTagField } from "@/components/profile/GearTagField";

export function PortfolioManageForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [gearTags, setGearTags] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError("Choose an image or video file.");
      return;
    }
    setPending(true);
    const fd = new FormData();
    fd.append("file", file);
    const up = await fetch("/api/upload", { method: "POST", body: fd });
    const upJson = (await up.json().catch(() => ({}))) as { url?: string; mediaType?: string; error?: string };
    if (!up.ok) {
      setPending(false);
      setError(upJson.error || "Upload failed.");
      return;
    }
    const res = await fetch("/api/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title || null,
        description: description || null,
        gearTags,
        url: upJson.url,
        mediaType: upJson.mediaType,
      }),
    });
    setPending(false);
    if (!res.ok) {
      setError("Could not save portfolio item.");
      return;
    }
    setTitle("");
    setDescription("");
    setGearTags([]);
    setFile(null);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Add portfolio piece</h2>
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
        Media file
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-1 block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium dark:text-zinc-400 dark:file:bg-zinc-800"
        />
        <span className="mt-1 block text-xs text-zinc-500">JPEG, PNG, WebP, GIF, MP4, WebM, or MOV — max 25MB.</span>
      </label>
      <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
        Title (optional)
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-sky-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        />
      </label>
      <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
        Description (optional)
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-sky-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        />
      </label>
      <div>
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Gear used (optional)</p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Tag the gear used for this piece.</p>
        <div className="mt-2">
          <GearTagField value={gearTags} onChange={setGearTags} />
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:opacity-60"
      >
        {pending ? "Uploading…" : "Upload"}
      </button>
    </form>
  );
}
