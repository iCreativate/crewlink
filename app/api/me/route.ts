import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/server";

/**
 * Session probe: always 200 so anonymous pages do not spam 401 in the network tab.
 * Clients should check `authenticated` (not only HTTP status).
 */
export async function GET() {
  try {
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
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    // Ensure the real error is visible in Vercel Function logs.
    console.error("[GET /api/me] failed", err);
    return NextResponse.json({
      authenticated: false as const,
      error: "Signed in, but the server could not load your profile.",
      hint:
        message.includes("DATABASE_URL") ||
        message.includes("PrismaClientInitializationError") ||
        message.includes("PrismaClientKnownRequestError")
          ? "Database connection is failing. Confirm DATABASE_URL is set in Vercel (Production + Preview) and redeploy."
          : "Check Vercel Function logs for the underlying error.",
    });
  }
}
