import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { deleteCrewTemplate, getCrewTemplateForOwner, updateCrewTemplate } from "@/api/crew-templates";
import { crewTemplateWriteSchema } from "@/lib/validations";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuthContext();
  if (!auth?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.appUser.role !== "MEDIA_HOUSE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const template = await getCrewTemplateForOwner(id, auth.appUser.id);
  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(template);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuthContext();
  if (!auth?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.appUser.role !== "MEDIA_HOUSE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const parsed = crewTemplateWriteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const template = await updateCrewTemplate(id, auth.appUser.id, parsed.data);
    if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(template);
  } catch (e) {
    if (e instanceof Error && e.message === "invalid_freelancer") {
      return NextResponse.json({ error: "One or more assigned users are not freelancers." }, { status: 400 });
    }
    throw e;
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuthContext();
  if (!auth?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.appUser.role !== "MEDIA_HOUSE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const ok = await deleteCrewTemplate(id, auth.appUser.id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
