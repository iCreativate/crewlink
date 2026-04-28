"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PortfolioDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onDelete() {
    if (!confirm("Remove this item from your portfolio?")) return;
    setPending(true);
    await fetch(`/api/portfolio/${id}`, { method: "DELETE" });
    setPending(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => void onDelete()}
      className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
    >
      {pending ? "Removing…" : "Remove"}
    </button>
  );
}
