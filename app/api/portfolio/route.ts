import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";
import { createPortfolioItem, listPortfolioFeed } from "@/api/portfolio";
import { portfolioCreateSchema } from "@/lib/validations";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const takeRaw = searchParams.get("take");
    const cursor = searchParams.get("cursor");
    const take = takeRaw ? Number(takeRaw) : 12;

    const ctx = await getAuthContext();
    const feed = await listPortfolioFeed({
      take: Number.isFinite(take) ? take : 12,
      cursor: cursor || null,
      viewerId: ctx?.appUser?.id ?? null,
    });

    return NextResponse.json(feed);
  } catch (e) {
    console.error("[GET /api/portfolio]", e);
    return NextResponse.json(
      {
        error: "Failed to load portfolio feed.",
        hint: "Run: npx prisma migrate deploy (or prisma db push) so the database matches the Prisma schema.",
      },
      { status: 503 },
    );
  }
}

export async function POST(req: Request) {
  const ctx = await getAuthContext();
  if (!ctx?.appUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (ctx.appUser.role !== "FREELANCER") {
    return NextResponse.json({ error: "Only freelancers can post portfolio items." }, { status: 403 });
  }

  const body = await req.json();
  const parsed = portfolioCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const item = await createPortfolioItem({
    userId: ctx.appUser.id,
    title: parsed.data.title,
    description: parsed.data.description,
    gearTags: parsed.data.gearTags,
    url: parsed.data.url,
    mediaType: parsed.data.mediaType,
  });

  return NextResponse.json(item, { status: 201 });
}
