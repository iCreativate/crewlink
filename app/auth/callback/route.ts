import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureAppUser } from "@/lib/auth/ensure-app-user";
import { postLoginPathForRole } from "@/lib/auth/post-login";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.redirect(`${origin}/login?error=supabase_not_configured`);
    }
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await ensureAppUser(user);
        const appUser = await prisma.user.findUnique({ where: { id: user.id } });
        const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : null;
        const path = safeNext ?? (appUser ? postLoginPathForRole(appUser.role) : "/dashboard");
        return NextResponse.redirect(`${origin}${path}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
