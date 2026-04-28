import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";

export const runtime = "nodejs";

const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

function safeExt(mime: string) {
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/gif") return ".gif";
  if (mime === "video/mp4") return ".mp4";
  if (mime === "video/webm") return ".webm";
  if (mime === "video/quicktime") return ".mov";
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
    return NextResponse.json({ error: "File too large (max 25MB)" }, { status: 400 });
  }

  const mime = file.type || "application/octet-stream";
  if (!ALLOWED.has(mime)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  const ext = safeExt(mime);
  if (!ext) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const name = `${crypto.randomUUID()}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", "portfolio", ctx.appUser.id);
  await mkdir(dir, { recursive: true });
  const fsPath = path.join(dir, name);
  await writeFile(fsPath, buf);

  const publicUrl = `/uploads/portfolio/${ctx.appUser.id}/${name}`;
  const mediaType = mime.startsWith("video/") ? "VIDEO" : "IMAGE";

  return NextResponse.json({ url: publicUrl, mediaType });
}
