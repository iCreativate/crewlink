import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { createCrewTemplate, listCrewTemplatesForOwner } from "@/api/crew-templates";
import { crewTemplateWriteSchema } from "@/lib/validations";

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (ctx.appUser.role !== "MEDIA_HOUSE") {
    return NextResponse.json({ error: "Only media houses can manage crew templates." }, { status: 403 });
  }

  const templates = await listCrewTemplatesForOwner(ctx.appUser.id);
  return NextResponse.json(templates);
}

export async function POST(req: Request) {
  const ctx = await getAuthContext();
  if (!ctx?.appUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (ctx.appUser.role !== "MEDIA_HOUSE") {
    return NextResponse.json({ error: "Only media houses can manage crew templates." }, { status: 403 });
  }

  const body = await req.json();
  const parsed = crewTemplateWriteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const template = await createCrewTemplate(ctx.appUser.id, parsed.data);
    return NextResponse.json(template, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "invalid_freelancer") {
      return NextResponse.json({ error: "One or more assigned users are not freelancers." }, { status: 400 });
    }
    throw e;
  }
}
