import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function parseRole(meta: Record<string, unknown> | undefined): UserRole {
  const r = meta?.role;
  if (r === "MEDIA_HOUSE" || r === "FREELANCER") return r;
  return "FREELANCER";
}

export async function ensureAppUser(supabaseUser: SupabaseUser) {
  const email = supabaseUser.email;
  if (!email) {
    throw new Error("Auth user missing email");
  }

  const meta = supabaseUser.user_metadata as Record<string, unknown> | undefined;
  const name =
    (typeof meta?.full_name === "string" && meta.full_name) ||
    (typeof meta?.name === "string" && meta.name) ||
    (typeof supabaseUser.user_metadata?.name === "string" ? supabaseUser.user_metadata.name : null) ||
    null;
  const image =
    (typeof meta?.avatar_url === "string" && meta.avatar_url) ||
    (typeof supabaseUser.user_metadata?.avatar_url === "string" ? supabaseUser.user_metadata.avatar_url : null);
  const companyName = typeof meta?.company_name === "string" ? meta.company_name : null;

  const emailVerified = supabaseUser.email_confirmed_at
    ? new Date(supabaseUser.email_confirmed_at)
    : null;

  const existing = await prisma.user.findUnique({ where: { id: supabaseUser.id } });
  if (existing) {
    return prisma.user.update({
      where: { id: supabaseUser.id },
      data: {
        email,
        emailVerified,
        name: name ?? existing.name,
        image: image ?? existing.image,
      },
    });
  }

  const role = parseRole(meta);
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        id: supabaseUser.id,
        email,
        emailVerified,
        name,
        image,
        role,
      },
    });
    await tx.profile.create({
      data: {
        userId: user.id,
        companyName: role === "MEDIA_HOUSE" ? companyName : null,
      },
    });
    return user;
  });
}
