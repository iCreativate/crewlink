import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";

const prisma = new PrismaClient();

const uuid = () => crypto.randomUUID();

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function sample(arr, n) {
  const copy = [...arr];
  const out = [];
  while (out.length < n && copy.length) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
}

const SPECIALIZATIONS = [
  "Director",
  "Producer",
  "DP",
  "Camera Operator",
  "Gaffer",
  "Sound Mixer",
  "Editor",
  "Colorist",
  "Photographer",
  "DIT",
  "Grip",
  "AC",
];

const SA_LOCATIONS = [
  "Cape Town, Western Cape",
  "Johannesburg, Gauteng",
  "Pretoria, Gauteng",
  "Durban, KwaZulu-Natal",
  "Gqeberha, Eastern Cape",
  "Stellenbosch, Western Cape",
  "Bloemfontein, Free State",
  "Polokwane, Limpopo",
];

const ZAR_DAY_RATES = ["R1,500/day", "R2,500/day", "R3,500/day", "R5,000/day", "R7,500/day"];

const FREELANCER_AVATARS = ["/seed/avatar-f1.svg", "/seed/avatar-f2.svg", "/seed/avatar-f3.svg"];
const MEDIA_AVATARS = ["/seed/avatar-m1.svg", "/seed/avatar-m2.svg"];
const FEED_MEDIA = ["/seed/work-1.svg", "/seed/work-2.svg", "/seed/work-3.svg"];

async function main() {
  // Keep seeding idempotent-ish by tagging emails.
  const tag = "seed";

  // If we already seeded, delete previous seed records so reruns update content.
  const seedEmailEndsWith = `.${tag}@crewlink.local`;
  const existingSeedUsers = await prisma.user.findMany({
    where: { email: { endsWith: seedEmailEndsWith } },
    select: { id: true },
  });
  if (existingSeedUsers.length) {
    const ids = existingSeedUsers.map((u) => u.id);
    await prisma.$transaction([
      prisma.feedPostLike.deleteMany({ where: { userId: { in: ids } } }),
      prisma.feedPost.deleteMany({ where: { authorId: { in: ids } } }),
      prisma.job.deleteMany({ where: { posterId: { in: ids } } }),
      prisma.portfolioItem.deleteMany({ where: { userId: { in: ids } } }),
      prisma.profile.deleteMany({ where: { userId: { in: ids } } }),
      prisma.user.deleteMany({ where: { id: { in: ids } } }),
    ]);
  }

  // Create media houses (posters)
  const mediaHouses = await Promise.all(
    Array.from({ length: 3 }).map(async (_v, i) => {
      const id = uuid();
      const email = `media${i + 1}.${tag}@crewlink.local`;
      return prisma.user.create({
        data: {
          id,
          email,
          emailVerified: new Date(),
          name: [`Northwind Studios`, `Blueframe Media`, `Crestline Productions`][i] ?? `Media House ${i + 1}`,
          image: MEDIA_AVATARS[i % MEDIA_AVATARS.length],
          role: "MEDIA_HOUSE",
          profile: {
            create: {
              companyName: [`Northwind Studios`, `Blueframe Media`, `Crestline Productions`][i] ?? `Media House ${i + 1}`,
              headline: "Hiring crew for upcoming shoots",
              location: pick(SA_LOCATIONS),
              website: "https://example.com",
            },
          },
        },
      });
    }),
  );

  // Create freelancers
  const freelancers = await Promise.all(
    Array.from({ length: 8 }).map(async (_v, i) => {
      const id = uuid();
      const name = [
        "Avery Collins",
        "Jordan Kim",
        "Riley Parker",
        "Casey Nguyen",
        "Morgan Lee",
        "Taylor Singh",
        "Quinn Rivera",
        "Jamie Chen",
      ][i];
      const email = `freelancer${i + 1}.${tag}@crewlink.local`;
      const specs = sample(SPECIALIZATIONS, Math.random() < 0.4 ? 2 : 1);
      return prisma.user.create({
        data: {
          id,
          email,
          emailVerified: new Date(),
          name,
          image: FREELANCER_AVATARS[i % FREELANCER_AVATARS.length],
          role: "FREELANCER",
          profile: {
            create: {
              headline: `${specs[0]} · Commercial & documentary`,
              bio: "Available for travel. Clean set etiquette. Happy to collaborate with small teams.",
              location: pick(SA_LOCATIONS),
              website: "https://example.com",
              specializations: specs,
              gearTags: sample(
                ["fx3", "a7siii", "bmpcc6k", "c70", "komodo", "mavic3", "sennheiser", "sounddevices", "nanlite", "aputure"],
                Math.random() < 0.5 ? 3 : 2,
              ),
              availableNow: Math.random() < 0.4,
            },
          },
        },
      });
    }),
  );

  // Seed portfolio items (work samples) for freelancers
  for (const f of freelancers) {
    const count = 2 + Math.floor(Math.random() * 2);
    const titles = ["Showreel cut", "BTS selects", "Commercial frame", "Doc moment", "Grade pass"];
    for (let i = 0; i < count; i++) {
      await prisma.portfolioItem.create({
        data: {
          userId: f.id,
          title: pick(titles),
          description: pick([
            "A quick highlight from a recent shoot.",
            "Selected frames from a tight-turnaround job.",
            "Testing a look and keeping skin tones natural.",
            "Small crew, fast day, clean delivery.",
          ]),
          gearTags: sample(
            ["fx3", "a7siii", "bmpcc6k", "c70", "komodo", "mavic3", "aputure", "nanlite"],
            2,
          ),
          mediaType: "IMAGE",
          url: pick(FEED_MEDIA),
        },
      });
    }
  }

  // Jobs (posted by media houses)
  const jobs = await Promise.all(
    Array.from({ length: 10 }).map(async () => {
      const poster = pick(mediaHouses);
      const role = pick(["Camera Op", "Gaffer", "Sound Mixer", "Editor", "AC", "DIT"]);
      const location = pick(SA_LOCATIONS);
      return prisma.job.create({
        data: {
          title: `${role} needed — ${location}`,
          description:
            "Shoot day rate + kit rental if applicable. Please include links to work and your preferred gear package.",
          location,
          payRate: pick(ZAR_DAY_RATES),
          gearRequirements: sample(["fx3", "komodo", "aputure", "nanlite", "lav", "timecode"], Math.random() < 0.6 ? 2 : 1),
          emergencyMode: Math.random() < 0.15,
          posterId: poster.id,
          status: "OPEN",
        },
      });
    }),
  );

  // Feed posts (work promos + collaboration)
  const authors = [...freelancers, ...mediaHouses];
  const basePosts = await Promise.all(
    Array.from({ length: 14 }).map(async () => {
      const author = pick(authors);
      const isCollab = Math.random() < 0.25;
      const attachMedia = Math.random() < 0.55;
      const bodies = [
        "Wrapped a two-day doc shoot. Loved the natural light on location.",
        "New reel cut — looking for feedback from producers.",
        "BTS from last week’s product spot. Small crew, big results.",
        "Available next week for short-form / branded content.",
        "Shot this on a minimal kit and a tight schedule — proud of the grade.",
        "Anyone need last-minute camera assist tomorrow?",
      ];
      return prisma.feedPost.create({
        data: {
          authorId: author.id,
          body: pick(bodies) + (Math.random() < 0.35 ? "\n\nHappy to connect with new collaborators." : ""),
          ...(attachMedia ? { mediaType: "IMAGE", mediaUrl: pick(FEED_MEDIA) } : {}),
          collab: isCollab,
          collabNote: isCollab ? pick(["Looking for an editor.", "Need a sound mixer.", "Seeking a DP for next month."]) : null,
        },
      });
    }),
  );

  // Reposts (shares)
  await Promise.all(
    Array.from({ length: 4 }).map(async () => {
      const sharer = pick(authors);
      const original = pick(basePosts);
      return prisma.feedPost.create({
        data: {
          authorId: sharer.id,
          body: "",
          sharedPostId: original.id,
        },
      });
    }),
  );

  // Random likes on feed posts
  const allPosts = await prisma.feedPost.findMany({ select: { id: true } });
  await Promise.all(
    allPosts.flatMap((p) =>
      sample(authors, Math.floor(Math.random() * 4)).map((u) =>
        prisma.feedPostLike.upsert({
          where: { postId_userId: { postId: p.id, userId: u.id } },
          create: { postId: p.id, userId: u.id },
          update: {},
        }),
      ),
    ),
  );

  console.log("Seed complete:");
  console.log(`- Freelancers: ${freelancers.length}`);
  console.log(`- Media houses: ${mediaHouses.length}`);
  console.log(`- Jobs: ${jobs.length}`);
  console.log(`- Feed posts: ${allPosts.length}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

