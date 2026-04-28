import { redirect } from "next/navigation";

export default async function LegacySubmissionRedirectPage() {
  redirect("/feed");
}

