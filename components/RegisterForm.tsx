"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { postLoginPathForRole } from "@/lib/auth/post-login";

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"FREELANCER" | "MEDIA_HOUSE">("FREELANCER");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setPending(true);

    const origin = window.location.origin;
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
        data: {
          role,
          full_name: name.trim() || undefined,
          company_name: role === "MEDIA_HOUSE" ? companyName.trim() || undefined : undefined,
        },
      },
    });

    if (signUpError) {
      setPending(false);
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      const meRes = await fetch("/api/me", { credentials: "include" });
      setPending(false);
      const meBody = (await meRes.json().catch(() => null)) as
        | { authenticated: true; role: "FREELANCER" | "MEDIA_HOUSE" }
        | { authenticated?: false; error?: string; hint?: string }
        | null;
      if (!meBody || !meBody.authenticated) {
        const msg =
          (meBody && typeof (meBody as any).error === "string" && (meBody as any).error) ||
          "Account created but profile sync failed. Try signing in.";
        const hint = meBody && typeof (meBody as any).hint === "string" ? (meBody as any).hint : null;
        setError(hint ? `${msg} ${hint}` : msg);
        return;
      }
      const me = meBody;
      router.push(postLoginPathForRole(me.role));
      router.refresh();
      return;
    }

    setPending(false);
    setInfo("Check your email for a confirmation link. After confirming, you can sign in.");
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-4 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">Create account</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Join as a freelancer or a media house. Role is stored in CrewLink after your first sign-in.
        </p>
      </div>
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      {info ? <p className="text-sm text-emerald-700 dark:text-emerald-400">{info}</p> : null}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-zinc-800 dark:text-zinc-200">I am a…</legend>
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="radio"
            name="role"
            checked={role === "FREELANCER"}
            onChange={() => setRole("FREELANCER")}
          />
          Freelancer (crew, creative, production)
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="radio"
            name="role"
            checked={role === "MEDIA_HOUSE"}
            onChange={() => setRole("MEDIA_HOUSE")}
          />
          Media house (hire crew & talent)
        </label>
      </fieldset>
      <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
        Name
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-sky-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          placeholder="Your name or brand"
        />
      </label>
      {role === "MEDIA_HOUSE" ? (
        <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Company name
          <input
            type="text"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-sky-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
        </label>
      ) : null}
      <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
        Email
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-sky-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        />
      </label>
      <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
        Password
        <input
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-sky-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        />
        <span className="mt-1 block text-xs text-zinc-500">At least 8 characters.</span>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-sky-600 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create account"}
      </button>
      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Already registered?{" "}
        <Link href="/login" className="font-medium text-sky-700 hover:underline dark:text-sky-400">
          Sign in
        </Link>
      </p>
    </form>
  );
}
