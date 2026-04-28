import { NextResponse } from "next/server";
import { distinctGearTagsForFilters, listFreelancers } from "@/api/freelancers";

function parseMulti(param: string | null): string[] {
  if (!param) return [];
  return param
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const specializations = parseMulti(searchParams.get("spec"));
  const gearTags = parseMulti(searchParams.get("gear"));
  const availableOnly = searchParams.get("available") === "1" || searchParams.get("available") === "true";
  const q = searchParams.get("q");

  const freelancers = await listFreelancers(
    { specializations, gearTags, availableOnly, search: q },
    60,
  );

  let popularGear: string[] = [];
  try {
    popularGear = await distinctGearTagsForFilters(60);
  } catch {
    /* empty DB or raw query unsupported */
  }

  return NextResponse.json({ freelancers, popularGear });
}
