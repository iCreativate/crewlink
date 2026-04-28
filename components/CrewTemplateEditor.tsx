"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Assignee = { id: string; name: string | null; image: string | null } | null;

export type CrewTemplateInitial = {
  name: string;
  description: string | null;
  roles: { roleName: string; assignedFreelancerId: string | null; assignedFreelancer: Assignee }[];
};

type RoleRow = {
  key: string;
  roleName: string;
  assignedFreelancerId: string | null;
  assignedName: string | null;
  assignedImage: string | null;
};

function newRow(): RoleRow {
  return {
    key: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `r-${Date.now()}-${Math.random()}`,
    roleName: "",
    assignedFreelancerId: null,
    assignedName: null,
    assignedImage: null,
  };
}

function FreelancerMiniSearch({
  onPick,
}: {
  onPick: (u: { id: string; name: string | null; image: string | null }) => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ id: string; name: string | null; image: string | null }[]>([]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const s = q.trim();
      if (s.length < 2) {
        setResults([]);
        return;
      }
      void fetch(`/api/freelancers?q=${encodeURIComponent(s)}`)
        .then((r) => r.json())
        .then((d: { freelancers?: typeof results }) => setResults(d.freelancers ?? []))
        .catch(() => setResults([]));
    }, 220);
    return () => window.clearTimeout(t);
  }, [q]);

  return (
    <div className="mt-2 space-y-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name…"
        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-sky-500/30 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
      />
      {results.length > 0 ? (
        <ul className="max-h-40 overflow-auto rounded-lg border border-zinc-200 bg-white text-sm dark:border-zinc-700 dark:bg-zinc-950">
          {results.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(u);
                  setQ("");
                  setResults([]);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                {u.image ? (
                  <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <Image src={u.image} alt="" fill className="object-cover" sizes="32px" />
                  </span>
                ) : (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
                    {(u.name ?? "?")[0]?.toUpperCase() ?? "?"}
                  </span>
                )}
                <span className="truncate font-medium text-zinc-900 dark:text-white">{u.name ?? u.id}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : q.trim().length >= 2 ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">No matches.</p>
      ) : null}
    </div>
  );
}

type Props = {
  templateId?: string | null;
  initial?: CrewTemplateInitial | null;
};

export function CrewTemplateEditor({ templateId, initial }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [roles, setRoles] = useState<RoleRow[]>(() => {
    if (initial?.roles?.length) {
      return initial.roles.map((r) => ({
        key: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `k-${r.roleName}`,
        roleName: r.roleName,
        assignedFreelancerId: r.assignedFreelancerId,
        assignedName: r.assignedFreelancer?.name ?? null,
        assignedImage: r.assignedFreelancer?.image ?? null,
      }));
    }
    return [newRow()];
  });
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const addRole = useCallback(() => setRoles((rs) => [...rs, newRow()]), []);
  const removeRole = useCallback((key: string) => {
    setRoles((rs) => (rs.length <= 1 ? rs : rs.filter((r) => r.key !== key)));
  }, []);

  async function onSave() {
    setError(null);
    setSavedMsg(null);
    const payloadRoles = roles
      .map((r) => ({
        roleName: r.roleName.trim(),
        assignedFreelancerId: r.assignedFreelancerId,
      }))
      .filter((r) => r.roleName.length > 0);
    if (!name.trim()) {
      setError("Template name is required.");
      return;
    }
    if (payloadRoles.length === 0) {
      setError("Add at least one crew role.");
      return;
    }

    setPending(true);
    const body = JSON.stringify({
      name: name.trim(),
      description: description.trim() ? description.trim() : null,
      roles: payloadRoles,
    });

    const url = templateId ? `/api/crew-templates/${templateId}` : "/api/crew-templates";
    const res = await fetch(url, {
      method: templateId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    const data = (await res.json().catch(() => ({}))) as { id?: string; error?: unknown };
    setPending(false);

    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Could not save template.");
      return;
    }

    setSavedMsg("Saved.");
    if (!templateId && data.id) {
      router.push(`/dashboard/crew/${data.id}`);
      router.refresh();
    } else {
      router.refresh();
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void onSave();
      }}
      className="space-y-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-8"
    >
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Crew template</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Name your lineup, add roles (e.g. LED Tech), and optionally assign freelancers. Reuse this template whenever you book the same crew.
        </p>
      </div>

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      {savedMsg ? <p className="text-sm text-emerald-700 dark:text-emerald-300">{savedMsg}</p> : null}

      <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
        Template name
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-2.5 text-zinc-900 outline-none ring-sky-500/40 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          placeholder="e.g. Corporate stream A-team"
        />
      </label>

      <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
        Notes (optional)
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 text-sm text-zinc-900 outline-none ring-sky-500/40 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          placeholder="When to use this crew, kit expectations…"
        />
      </label>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Roles</p>
          <button
            type="button"
            onClick={addRole}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Add role
          </button>
        </div>

        <ul className="space-y-6">
          {roles.map((row, idx) => (
            <li key={row.key} className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Role {idx + 1}
                </p>
                <button
                  type="button"
                  onClick={() => removeRole(row.key)}
                  className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                >
                  Remove
                </button>
              </div>
              <label className="mt-2 block text-sm font-medium text-zinc-800 dark:text-zinc-200">
                Role title
                <input
                  value={row.roleName}
                  onChange={(e) =>
                    setRoles((rs) => rs.map((r) => (r.key === row.key ? { ...r, roleName: e.target.value } : r)))
                  }
                  className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-2.5 text-zinc-900 outline-none ring-sky-500/40 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                  placeholder="e.g. Sound engineer"
                />
              </label>

              <div className="mt-3">
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Assigned freelancer</p>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  Leave unassigned for an open role on the public board. Assign someone to send a direct offer they alone can accept.
                </p>
                {row.assignedFreelancerId ? (
                  <div className="mt-2 flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/60">
                    {row.assignedImage ? (
                      <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <Image src={row.assignedImage} alt="" fill className="object-cover" sizes="36px" />
                      </span>
                    ) : (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
                        {(row.assignedName ?? "?")[0]?.toUpperCase() ?? "?"}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">
                        {row.assignedName ?? "Freelancer"}
                      </p>
                      <Link
                        href={`/profile/${row.assignedFreelancerId}`}
                        className="text-xs text-sky-700 hover:underline dark:text-sky-400"
                      >
                        View profile
                      </Link>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setRoles((rs) =>
                          rs.map((r) =>
                            r.key === row.key
                              ? {
                                  ...r,
                                  assignedFreelancerId: null,
                                  assignedName: null,
                                  assignedImage: null,
                                }
                              : r,
                          ),
                        )
                      }
                      className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <FreelancerMiniSearch
                    onPick={(u) =>
                      setRoles((rs) =>
                        rs.map((r) =>
                          r.key === row.key
                            ? {
                                ...r,
                                assignedFreelancerId: u.id,
                                assignedName: u.name,
                                assignedImage: u.image,
                              }
                            : r,
                        ),
                      )
                    }
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-gradient-to-r from-sky-600 to-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:from-sky-500 hover:to-indigo-500 disabled:opacity-60"
      >
        {pending ? "Saving…" : templateId ? "Save changes" : "Create template"}
      </button>
    </form>
  );
}
