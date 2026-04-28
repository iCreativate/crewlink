"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { postLoginPathForRole } from "@/lib/auth/post-login";

type MeResponse = {
  authenticated: true;
  id: string;
  email: string;
  name: string | null;
  role: "FREELANCER" | "MEDIA_HOUSE";
};

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const callbackUrl = search.get("callbackUrl");
  const authError = search.get("error") === "auth";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const demoFreelancerEmail = process.env.NEXT_PUBLIC_DEMO_FREELANCER_EMAIL ?? "";
  const demoFreelancerPassword = process.env.NEXT_PUBLIC_DEMO_FREELANCER_PASSWORD ?? "";
  const demoMediaEmail = process.env.NEXT_PUBLIC_DEMO_MEDIA_EMAIL ?? "";
  const demoMediaPassword = process.env.NEXT_PUBLIC_DEMO_MEDIA_PASSWORD ?? "";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const loginRes = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });
    const loginBody = (await loginRes.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    if (!loginRes.ok || !loginBody?.ok) {
      setPending(false);
      setError(loginBody?.error || "Sign in failed. Try again.");
      return;
    }

    const meRes = await fetch("/api/me", { credentials: "include" });
    const meBody = (await meRes.json().catch(() => null)) as
      | (MeResponse & { error?: never; hint?: never })
      | { authenticated?: false; error?: string; hint?: string }
      | null;
    if (!meBody || !("authenticated" in meBody) || !meBody.authenticated) {
      setPending(false);
      const msg =
        (meBody && typeof (meBody as any).error === "string" && (meBody as any).error) ||
        "Signed in but profile could not be loaded. Try again.";
      const hint = meBody && typeof (meBody as any).hint === "string" ? (meBody as any).hint : null;
      setError(hint ? `${msg} ${hint}` : msg);
      return;
    }
    const me = meBody as MeResponse;

    const safeCallback =
      callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : null;

    const destination = safeCallback ?? postLoginPathForRole(me.role);
    setPending(false);
    router.push(destination);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-4 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">Sign in</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Sign in with your Supabase account.</p>
      </div>
      {authError ? (
        <p className="text-sm text-red-600 dark:text-red-400">Something went wrong confirming your email. Try again.</p>
      ) : null}
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
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
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-sky-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-sky-600 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>

      {demoFreelancerEmail && demoFreelancerPassword ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900/40">
          <p className="font-medium text-zinc-900 dark:text-white">Demo logins</p>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            These accounts must exist in Supabase Auth for this project.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
              onClick={() => {
                setEmail(demoFreelancerEmail);
                setPassword(demoFreelancerPassword);
              }}
            >
              Use demo freelancer
            </button>
            {demoMediaEmail && demoMediaPassword ? (
              <button
                type="button"
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
                onClick={() => {
                  setEmail(demoMediaEmail);
                  setPassword(demoMediaPassword);
                }}
              >
                Use demo media house
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        No account?{" "}
        <Link href="/register" className="font-medium text-sky-700 hover:underline dark:text-sky-400">
          Register
        </Link>
      </p>
    </form>
  );
}
