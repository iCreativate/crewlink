"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AvatarField } from "@/components/profile/AvatarField";
import { AvailabilitySwitch } from "@/components/profile/AvailabilitySwitch";
import { GearTagField } from "@/components/profile/GearTagField";
import { SpecializationGrid } from "@/components/profile/SpecializationGrid";

export type ProfileEditInitial = {
  role: "FREELANCER" | "MEDIA_HOUSE";
  name: string | null;
  image: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  companyName: string | null;
  specializations: string[];
  gearTags: string[];
  availableNow: boolean;
};

export function ProfileEditForm({ initial }: { initial: ProfileEditInitial }) {
  const router = useRouter();
  const isFreelancer = initial.role === "FREELANCER";

  const [name, setName] = useState(initial.name ?? "");
  const [image, setImage] = useState(initial.image ?? "");
  const [headline, setHeadline] = useState(initial.headline ?? "");
  const [bio, setBio] = useState(initial.bio ?? "");
  const [location, setLocation] = useState(initial.location ?? "");
  const [website, setWebsite] = useState(initial.website ?? "");
  const [companyName, setCompanyName] = useState(initial.companyName ?? "");
  const [specializations, setSpecializations] = useState<string[]>(initial.specializations);
  const [gearTags, setGearTags] = useState<string[]>(initial.gearTags);
  const [availableNow, setAvailableNow] = useState(initial.availableNow);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setPending(true);

    const body: Record<string, unknown> = {
      headline: headline || null,
      bio: bio || null,
      location: location || null,
      website: website || "",
      image: image || "",
    };

    if (isFreelancer) {
      body.name = name.trim() || null;
      body.specializations = specializations;
      body.gearTags = gearTags;
      body.availableNow = availableNow;
    } else {
      body.companyName = companyName || null;
    }

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setPending(false);
    if (!res.ok) {
      setError("Could not save profile.");
      return;
    }
    setMessage("Saved.");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-3xl space-y-10 rounded-3xl border border-zinc-200/80 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-10"
    >
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">Edit profile</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {isFreelancer
            ? "Curate how producers discover you — clear specializations and gear help you get booked."
            : "Company details visible on your public profile."}
        </p>
      </header>

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700 dark:text-emerald-400">{message}</p> : null}

      <section className="space-y-6 border-b border-zinc-100 pb-10 dark:border-zinc-800/80">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Identity</h2>
        <AvatarField
          imageUrl={image || null}
          displayName={(isFreelancer ? name : companyName) || "You"}
          onUploaded={(url) => setImage(url)}
        />
        {isFreelancer ? (
          <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Display name
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-2.5 text-zinc-900 outline-none ring-sky-500/40 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
          </label>
        ) : null}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">About</h2>
        <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
          {isFreelancer ? "Headline" : "Tagline"}
          <input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder={isFreelancer ? "e.g. DP · Commercial & documentary" : undefined}
            className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-2.5 text-zinc-900 outline-none ring-sky-500/40 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
        </label>
        <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Bio
          <textarea
            rows={6}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="mt-2 w-full resize-y rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 text-sm leading-relaxed text-zinc-900 outline-none ring-sky-500/40 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
        </label>
      </section>

      {isFreelancer ? (
        <>
          <section className="space-y-4 border-t border-zinc-100 pt-10 dark:border-zinc-800/80">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Specializations
              </h2>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Select every hat you wear on set.</p>
            </div>
            <SpecializationGrid value={specializations} onChange={setSpecializations} />
          </section>

          <section className="space-y-4 border-t border-zinc-100 pt-10 dark:border-zinc-800/80">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Gear expertise
              </h2>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Brands, bodies, packages — helps media houses match kit.</p>
            </div>
            <GearTagField value={gearTags} onChange={setGearTags} />
          </section>

          <section className="space-y-4 border-t border-zinc-100 pt-10 dark:border-zinc-800/80">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Availability</h2>
            <AvailabilitySwitch value={availableNow} onChange={setAvailableNow} />
          </section>
        </>
      ) : (
        <section className="space-y-4 border-t border-zinc-100 pt-10 dark:border-zinc-800/80">
          <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Company name
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-2.5 text-zinc-900 outline-none ring-sky-500/40 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
          </label>
        </section>
      )}

      <section className="space-y-4 border-t border-zinc-100 pt-10 dark:border-zinc-800/80">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Location & web</h2>
        <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Location
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-2.5 text-zinc-900 outline-none ring-sky-500/40 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
        </label>
        <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Website
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://"
            className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-2.5 text-zinc-900 outline-none ring-sky-500/40 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
        </label>
      </section>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-gradient-to-r from-sky-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-md transition hover:from-sky-500 hover:to-indigo-500 disabled:opacity-60 sm:w-auto sm:px-10"
      >
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
