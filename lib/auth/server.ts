import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { ensureAppUser } from "@/lib/auth/ensure-app-user";
import { postLoginPathForRole } from "@/lib/auth/post-login";

export type AuthContext = {
  supabaseUser: SupabaseUser;
  appUser: NonNullable<Awaited<ReturnType<typeof prisma.user.findUnique>>>;
};

export { postLoginPathForRole };

export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();
  if (!supabaseUser) return null;

  let appUser = await prisma.user.findUnique({ where: { id: supabaseUser.id } });
  if (!appUser) {
    try {
      appUser = await ensureAppUser(supabaseUser);
    } catch {
      return null;
    }
  }

  return { supabaseUser, appUser };
}

export async function requireAuth(loginPath = "/login"): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) redirect(`${loginPath}?callbackUrl=${encodeURIComponent("/dashboard")}`);
  return ctx;
}

export async function requireRole(role: UserRole, redirectTo: string): Promise<AuthContext> {
  const ctx = await requireAuth();
  if (ctx.appUser.role !== role) redirect(redirectTo);
  return ctx;
}
