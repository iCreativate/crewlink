import { Suspense } from "react";
import { RegisterForm } from "@/components/RegisterForm";
import { redirectIfAuthenticated } from "@/lib/auth/server";

export default async function RegisterPage() {
  await redirectIfAuthenticated();
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <Suspense
        fallback={
          <div className="mx-auto h-64 max-w-md animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
        }
      >
        <RegisterForm />
      </Suspense>
    </div>
  );
}
