/** Parse API error message from JSON responses. */
export async function readApiError(res: Response, fallback = "Something went wrong."): Promise<string> {
  const body = (await res.json().catch(() => null)) as { error?: string | Record<string, unknown> } | null;
  if (!body?.error) return fallback;
  if (typeof body.error === "string") return body.error;
  return fallback;
}
