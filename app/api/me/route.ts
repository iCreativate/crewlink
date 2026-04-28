import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";

/**
 * Session probe: always 200 so anonymous pages do not spam 401 in the network tab.
 * Clients should check `authenticated` (not only HTTP status).
 */
export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx) {
    return NextResponse.json({ authenticated: false as const });
  }

  const { appUser } = ctx;
  return NextResponse.json({
    authenticated: true as const,
    id: appUser.id,
    email: appUser.email,
    name: appUser.name,
    role: appUser.role,
  });
}
