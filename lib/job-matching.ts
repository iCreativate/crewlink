import type { Job, Profile, User } from "@prisma/client";

export type MatchBreakdown = {
  gearScore: number;
  availabilityScore: number;
  locationScore: number;
  matchedGear: string[];
  total: number;
};

export type RankedFreelancerMatch = {
  user: Pick<User, "id" | "name" | "image">;
  profile: Profile;
  breakdown: MatchBreakdown;
};

const MAX_GEAR_SCORE = 56;
const GEAR_PER_MATCH = 14;
const AVAILABILITY_SCORE = 22;

function normalizeLoc(s: string | null | undefined): string {
  return (s ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

/** Location proximity using text overlap (no geocoding). */
export function scoreLocationProximity(jobLocation: string | null, profileLocation: string | null): number {
  const j = normalizeLoc(jobLocation);
  const p = normalizeLoc(profileLocation);

  if (!j && !p) return 6;
  if (!j) return 4;
  if (!p) return 3;

  if (/\bremote\b|anywhere|worldwide|nationwide/.test(j)) return 14;
  if (/\bremote\b|will travel|nationwide|anywhere/.test(p)) return 12;

  if (j === p) return 34;
  if (j.includes(p) || p.includes(j)) return 22;

  const tokenize = (x: string) =>
    new Set(
      x
        .split(/[\s,/|·]+/)
        .map((t) => t.trim())
        .filter((t) => t.length >= 3),
    );

  const jt = tokenize(j);
  const pt = tokenize(p);
  let exactTokens = 0;
  for (const t of jt) {
    if (pt.has(t)) exactTokens += 1;
  }
  let partial = 0;
  for (const t of jt) {
    if (t.length < 4) continue;
    for (const u of pt) {
      if (t === u) continue;
      if (u.includes(t) || t.includes(u)) {
        partial += 1;
        break;
      }
    }
  }

  const tokenScore = Math.min(exactTokens * 7 + Math.min(partial, 3) * 4, 24);
  return tokenScore;
}

/** Count job gear requirements satisfied by freelancer profile tags. */
export function matchGearTags(jobGear: string[], profileGear: string[]): { score: number; matched: string[] } {
  if (jobGear.length === 0) {
    return { score: profileGear.length > 0 ? 6 : 4, matched: [] };
  }

  const have = profileGear.map((g) => g.toLowerCase());
  const matched: string[] = [];

  for (const raw of jobGear) {
    const r = raw.toLowerCase();
    let hit = false;
    if (have.includes(r)) {
      hit = true;
    } else {
      for (const h of have) {
        if (h.length >= 3 && (h.includes(r) || r.includes(h))) {
          hit = true;
          break;
        }
      }
    }
    if (hit) matched.push(raw);
  }

  const uniqueMatched = [...new Set(matched)];
  const score = Math.min(uniqueMatched.length * GEAR_PER_MATCH, MAX_GEAR_SCORE);
  return { score, matched: uniqueMatched };
}

export function scoreFreelancerForJob(job: Pick<Job, "location" | "gearRequirements">, profile: Profile): MatchBreakdown {
  const { score: gearScore, matched: matchedGear } = matchGearTags(job.gearRequirements, profile.gearTags);
  const availabilityScore = profile.availableNow ? AVAILABILITY_SCORE : 0;
  const locationScore = scoreLocationProximity(job.location, profile.location);
  const total = gearScore + availabilityScore + locationScore;

  return {
    gearScore,
    availabilityScore,
    locationScore,
    matchedGear,
    total,
  };
}

export function compareMatches(a: RankedFreelancerMatch, b: RankedFreelancerMatch): number {
  if (b.breakdown.total !== a.breakdown.total) return b.breakdown.total - a.breakdown.total;
  const an = a.user.name ?? "";
  const bn = b.user.name ?? "";
  return an.localeCompare(bn);
}
