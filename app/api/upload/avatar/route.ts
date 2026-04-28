import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

function safeExt(mime: string) {
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  return "";
}

export async function POST(req: Request) {
  const ctx = await getAuthContext();
  if (!ctx?.appUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image too large (max 5MB)" }, { status: 400 });
  }

  const mime = file.type || "";
  if (!ALLOWED.has(mime)) {
    return NextResponse.json({ error: "Use JPEG, PNG, or WebP" }, { status: 400 });
  }

  const ext = safeExt(mime);
  if (!ext) {
    return NextResponse.json({ error: "Unsupported type" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const name = `${crypto.randomUUID()}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", "avatars", ctx.appUser.id);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buf);

  const publicUrl = `/uploads/avatars/${ctx.appUser.id}/${name}`;
  return NextResponse.json({ url: publicUrl });
}
