import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

const supabaseUrl = required("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = required("SUPABASE_SERVICE_ROLE_KEY");
const demoFreelancerEmail = required("NEXT_PUBLIC_DEMO_FREELANCER_EMAIL");
const demoFreelancerPassword = required("NEXT_PUBLIC_DEMO_FREELANCER_PASSWORD");
const demoMediaEmail = required("NEXT_PUBLIC_DEMO_MEDIA_EMAIL");
const demoMediaPassword = required("NEXT_PUBLIC_DEMO_MEDIA_PASSWORD");

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const prisma = new PrismaClient();

async function createOrUpdateUser({
  email,
  password,
  role,
  fullName,
  companyName,
}) {
  // Create or update Supabase Auth user
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role,
      full_name: fullName,
      ...(role === "MEDIA_HOUSE" ? { company_name: companyName } : {}),
    },
  });

  if (error) {
    // If user already exists, update metadata + password
    if (String(error.message || "").toLowerCase().includes("already registered")) {
      const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
      if (listErr) throw listErr;
      const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (!existing) throw error;

      const { data: updated, error: updErr } = await supabase.auth.admin.updateUserById(existing.id, {
        password,
        user_metadata: {
          role,
          full_name: fullName,
          ...(role === "MEDIA_HOUSE" ? { company_name: companyName } : {}),
        },
      });
      if (updErr) throw updErr;
      return updated.user;
    }
    throw error;
  }

  return data.user;
}

async function ensurePrismaUser(authUser) {
  const role = authUser.user_metadata?.role === "MEDIA_HOUSE" ? "MEDIA_HOUSE" : "FREELANCER";
  const fullName = typeof authUser.user_metadata?.full_name === "string" ? authUser.user_metadata.full_name : null;
  const companyName =
    typeof authUser.user_metadata?.company_name === "string" ? authUser.user_metadata.company_name : null;

  await prisma.$transaction(async (tx) => {
    await tx.user.upsert({
      where: { id: authUser.id },
      create: {
        id: authUser.id,
        email: authUser.email,
        emailVerified: new Date(),
        name: fullName,
        image: null,
        role,
      },
      update: {
        email: authUser.email,
        emailVerified: new Date(),
        name: fullName,
        role,
      },
    });

    await tx.profile.upsert({
      where: { userId: authUser.id },
      create: {
        userId: authUser.id,
        companyName: role === "MEDIA_HOUSE" ? companyName : null,
      },
      update: {
        companyName: role === "MEDIA_HOUSE" ? companyName : null,
      },
    });
  });
}

async function main() {
  const freelancer = await createOrUpdateUser({
    email: demoFreelancerEmail,
    password: demoFreelancerPassword,
    role: "FREELANCER",
    fullName: "Demo Freelancer",
  });

  const media = await createOrUpdateUser({
    email: demoMediaEmail,
    password: demoMediaPassword,
    role: "MEDIA_HOUSE",
    fullName: "Demo Producer",
    companyName: "Demo Media Co",
  });

  await ensurePrismaUser(freelancer);
  await ensurePrismaUser(media);

  console.log("Demo users ready:");
  console.log(`- FREELANCER: ${demoFreelancerEmail}`);
  console.log(`- MEDIA_HOUSE: ${demoMediaEmail}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

