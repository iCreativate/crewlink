import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { upsertProfileForUser } from "@/api/profile";
import { profileUpdateSchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  const ctx = await getAuthContext();
  if (!ctx?.appUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const {
    name,
    image,
    headline,
    bio,
    location,
    website,
    companyName,
    specializations,
    gearTags,
    availableNow,
  } = parsed.data;

  // Allow both roles to set profile picture. Name changes remain freelancer-only (media houses use profile.companyName).
  const userUpdate: { name?: string | null; image?: string | null } = {};
  if (ctx.appUser.role === "FREELANCER" && name !== undefined) userUpdate.name = name;
  if (image !== undefined) userUpdate.image = image === "" ? null : image;
  if (Object.keys(userUpdate).length > 0) {
    await prisma.user.update({
      where: { id: ctx.appUser.id },
      data: userUpdate,
    });
  }

  await upsertProfileForUser(ctx.appUser.id, {
    headline,
    bio,
    location,
    website: website === "" ? null : website,
    companyName: ctx.appUser.role === "MEDIA_HOUSE" ? companyName ?? null : undefined,
    specializations: ctx.appUser.role === "FREELANCER" ? specializations : undefined,
    gearTags: ctx.appUser.role === "FREELANCER" ? gearTags : undefined,
    availableNow: ctx.appUser.role === "FREELANCER" ? availableNow : undefined,
  });

  const user = await prisma.user.findUnique({
    where: { id: ctx.appUser.id },
    include: { profile: true },
  });

  return NextResponse.json(user);
}
