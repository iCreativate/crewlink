"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteCrewTemplateButton({ templateId }: { templateId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onDelete() {
    if (!window.confirm("Delete this crew template? Saved assignments will be removed.")) return;
    setPending(true);
    const res = await fetch(`/api/crew-templates/${templateId}`, { method: "DELETE" });
    setPending(false);
    if (!res.ok) return;
    router.push("/dashboard/crew");
    router.refresh();
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => void onDelete()}
      className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
    >
      {pending ? "Deleting…" : "Delete template"}
    </button>
  );
}
