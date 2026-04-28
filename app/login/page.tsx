import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <Suspense
        fallback={
          <div className="mx-auto h-64 max-w-md animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
