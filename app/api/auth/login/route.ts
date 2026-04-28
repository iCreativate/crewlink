import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false as const, error: "Invalid JSON body" }, { status: 400 });
  }

  const email = typeof (body as any)?.email === "string" ? (body as any).email : "";
  const password = typeof (body as any)?.password === "string" ? (body as any).password : "";

  if (!email || !password) {
    return NextResponse.json({ ok: false as const, error: "Email and password are required" }, { status: 400 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false as const, error: "Supabase is not configured on the server" },
      { status: 500 },
    );
  }
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return NextResponse.json({ ok: false as const, error: error.message }, { status: 401 });
  }

  return NextResponse.json({ ok: true as const });
}

