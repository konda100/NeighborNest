import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const CATEGORIES = [
  { name: "Gutter cleaning", icon: "🪜", description: "Gutter cleaning, guards, and downspouts" },
  { name: "Lawn care / landscaping", icon: "🌱", description: "Mowing, landscaping, and yard maintenance" },
  { name: "Pressure washing", icon: "💦", description: "Driveways, siding, decks, and patios" },
  { name: "Handyman / small repairs", icon: "🔧", description: "Odd jobs and small home repairs" },
  { name: "HVAC service", icon: "❄️", description: "Heating, cooling, and air quality" },
  { name: "Pest control", icon: "🐜", description: "Pest prevention and treatment" },
  { name: "House cleaning", icon: "🧹", description: "Interior cleaning services" },
];

async function main() {
  console.log("Seeding NeighborNest...");

  // --- Geography ---------------------------------------------------------
  const nc = await prisma.state.create({ data: { name: "North Carolina", code: "NC" } });
  const chatham = await prisma.county.create({ data: { name: "Chatham", stateId: nc.id } });
  const pittsboro = await prisma.city.create({ data: { name: "Pittsboro", countyId: chatham.id } });

  const corbett = await prisma.neighborhood.create({
    data: {
      name: "Corbett Landing",
      slug: "corbett-landing",
      description:
        "A new community under development in Pittsboro. ~20 occupied homes today with ~20 more closing through 2026.",
      cityId: pittsboro.id,
      zip: "27312",
      homeCount: 40,
    },
  });

  const fearrington = await prisma.neighborhood.create({
    data: {
      name: "Fearrington Village",
      slug: "fearrington-village",
      description: "Established community near Pittsboro.",
      cityId: pittsboro.id,
      zip: "27312",
      homeCount: 1600,
    },
  });

  const briarChapel = await prisma.neighborhood.create({
    data: {
      name: "Briar Chapel",
      slug: "briar-chapel",
      description: "Large master-planned community in Chatham County.",
      cityId: pittsboro.id,
      zip: "27516",
      homeCount: 2400,
    },
  });

  // --- Categories --------------------------------------------------------
  const categories: Record<string, { id: string; slug: string }> = {};
  for (const c of CATEGORIES) {
    const slug = slugify(c.name);
    const created = await prisma.serviceCategory.create({
      data: { name: c.name, slug, icon: c.icon, description: c.description },
    });
    categories[slug] = { id: created.id, slug };
  }

  // --- Users -------------------------------------------------------------
  const passwordHash = await bcrypt.hash("password123", 10);
  async function makeUser(name: string, email: string, neighborhoodId: string, role = "resident") {
    return prisma.user.create({
      data: { name, email, passwordHash, neighborhoodId, role },
    });
  }

  const you = await makeUser("Alex (You)", "alex@corbett.test", corbett.id, "admin");
  const priya = await makeUser("Priya Nair", "priya@corbett.test", corbett.id);
  const marcus = await makeUser("Marcus Lee", "marcus@corbett.test", corbett.id);
  const dana = await makeUser("Dana Wright", "dana@corbett.test", corbett.id);
  const sam = await makeUser("Sam Patel", "sam@corbett.test", corbett.id);
  const jordan = await makeUser("Jordan Kim", "jordan@corbett.test", corbett.id);
  const fearUser = await makeUser("Chris Hall", "chris@fearrington.test", fearrington.id);

  // --- Providers ---------------------------------------------------------
  async function makeProvider(
    name: string,
    catSlugs: string[],
    extra: { phone?: string; website?: string; serviceArea?: string; description?: string; verified?: boolean } = {}
  ) {
    return prisma.provider.create({
      data: {
        name,
        phone: extra.phone,
        website: extra.website,
        serviceArea: extra.serviceArea,
        description: extra.description,
        verified: extra.verified ?? false,
        categories: { create: catSlugs.map((s) => ({ categoryId: categories[s].id })) },
      },
    });
  }

  const gutterPros = await makeProvider("Triangle Gutter Pros", ["gutter-cleaning"], {
    phone: "(919) 555-0142",
    website: "trianglegutterpros.example.com",
    serviceArea: "Pittsboro, Chapel Hill, Cary",
    description: "Gutter cleaning, guard installs, and minor repairs. Great with 2-story homes.",
    verified: true,
  });
  const chathamGutter = await makeProvider("Chatham Gutter Co.", ["gutter-cleaning", "pressure-washing"], {
    phone: "(919) 555-0188",
    serviceArea: "Chatham County",
    description: "Local gutter and exterior cleaning crew.",
  });
  const greenLawn = await makeProvider("GreenScape Lawn Care", ["lawn-care-landscaping"], {
    phone: "(919) 555-0119",
    website: "greenscapenc.example.com",
    serviceArea: "Pittsboro & Chapel Hill",
    description: "Weekly mowing, mulch, and seasonal cleanups.",
    verified: true,
  });
  const washIt = await makeProvider("Carolina Power Wash", ["pressure-washing"], {
    phone: "(919) 555-0173",
    serviceArea: "Greater Triangle",
    description: "Soft-wash siding, driveways, and decks.",
  });
  const fixIt = await makeProvider("Pittsboro Handyman Services", ["handyman-small-repairs"], {
    phone: "(919) 555-0155",
    serviceArea: "Pittsboro",
    description: "Drywall, fixtures, mounting, and odd jobs.",
  });
  const coolAir = await makeProvider("ClearSky HVAC", ["hvac-service"], {
    phone: "(919) 555-0201",
    website: "clearskyhvac.example.com",
    serviceArea: "Chatham & Orange County",
    description: "HVAC tune-ups, repair, and installs.",
    verified: true,
  });
  const bugOff = await makeProvider("BugOff Pest Control", ["pest-control"], {
    phone: "(919) 555-0166",
    serviceArea: "Chatham County",
    description: "Quarterly pest prevention plans.",
  });
  const tidyHome = await makeProvider("TidyHome Cleaning", ["house-cleaning"], {
    phone: "(919) 555-0190",
    serviceArea: "Pittsboro & Cary",
    description: "Recurring and deep cleans.",
  });

  // --- Recommendations ---------------------------------------------------
  async function rec(
    author: { id: string },
    provider: { id: string },
    catSlug: string,
    neighborhoodId: string,
    opts: {
      rating: number;
      recommend?: boolean;
      timesUsed?: string;
      pricePaid?: string;
      comment?: string;
      groupInterest?: boolean;
      groupTargetDate?: string;
    }
  ) {
    return prisma.recommendation.create({
      data: {
        authorId: author.id,
        providerId: provider.id,
        categoryId: categories[catSlug].id,
        neighborhoodId,
        rating: opts.rating,
        recommend: opts.recommend ?? true,
        timesUsed: opts.timesUsed,
        pricePaid: opts.pricePaid,
        comment: opts.comment,
        groupInterest: opts.groupInterest ?? false,
        groupTargetDate: opts.groupTargetDate,
      },
    });
  }

  // Gutter cleaning — the headline category for Corbett Landing.
  await rec(you, gutterPros, "gutter-cleaning", corbett.id, {
    rating: 5,
    timesUsed: "2-3",
    pricePaid: "$180 for 2-story",
    comment: "Thorough and on time. Cleaned downspouts too.",
    groupInterest: true,
    groupTargetDate: "Fall 2026",
  });
  await rec(priya, gutterPros, "gutter-cleaning", corbett.id, {
    rating: 5,
    timesUsed: "1",
    pricePaid: "$175 for 2-story",
    comment: "Easy to schedule, friendly crew.",
    groupInterest: true,
    groupTargetDate: "Fall 2026",
  });
  await rec(marcus, gutterPros, "gutter-cleaning", corbett.id, {
    rating: 4,
    timesUsed: "1",
    pricePaid: "$190",
    comment: "Good work, ran a bit late.",
    groupInterest: true,
    groupTargetDate: "Fall 2026",
  });
  await rec(dana, chathamGutter, "gutter-cleaning", corbett.id, {
    rating: 4,
    timesUsed: "1",
    pricePaid: "$160",
    comment: "Decent price, no guard service though.",
    groupInterest: true,
    groupTargetDate: "Fall 2026",
  });
  await rec(sam, gutterPros, "gutter-cleaning", corbett.id, {
    rating: 5,
    pricePaid: "$185 for 2-story",
    comment: "Would book again with neighbors.",
    groupInterest: true,
    groupTargetDate: "Fall 2026",
  });

  // Lawn care
  await rec(priya, greenLawn, "lawn-care-landscaping", corbett.id, {
    rating: 5,
    timesUsed: "4+",
    pricePaid: "$45/visit",
    comment: "Reliable weekly mow.",
    groupInterest: true,
  });
  await rec(jordan, greenLawn, "lawn-care-landscaping", corbett.id, {
    rating: 4,
    timesUsed: "2-3",
    pricePaid: "$50/visit",
  });

  // Pressure washing
  await rec(marcus, washIt, "pressure-washing", corbett.id, {
    rating: 5,
    pricePaid: "$250 driveway + siding",
    comment: "Driveway looks new.",
    groupInterest: true,
  });
  await rec(dana, washIt, "pressure-washing", corbett.id, { rating: 4, pricePaid: "$220" });

  // HVAC
  await rec(sam, coolAir, "hvac-service", corbett.id, {
    rating: 5,
    timesUsed: "2-3",
    pricePaid: "$120 tune-up",
    comment: "Honest, no upsell.",
  });

  // Handyman
  await rec(you, fixIt, "handyman-small-repairs", corbett.id, {
    rating: 4,
    pricePaid: "$75/hr",
    comment: "Mounted TVs and fixed a door.",
  });

  // Pest + cleaning
  await rec(jordan, bugOff, "pest-control", corbett.id, { rating: 4, pricePaid: "$110/quarter" });
  await rec(dana, tidyHome, "house-cleaning", corbett.id, {
    rating: 5,
    pricePaid: "$140 biweekly",
    comment: "Great attention to detail.",
  });

  // A recommendation from a neighboring community for cross-scope testing.
  await rec(fearUser, gutterPros, "gutter-cleaning", fearrington.id, {
    rating: 5,
    pricePaid: "$200",
    comment: "Used them in Fearrington too.",
  });

  // --- Group deals -------------------------------------------------------
  const gutterDeal = await prisma.groupDeal.create({
    data: {
      title: "Fall 2026 Gutter Cleaning — Corbett Landing block deal",
      categoryId: categories["gutter-cleaning"].id,
      neighborhoodId: corbett.id,
      organizerId: you.id,
      description:
        "Let's book one provider to run our whole street in a single visit and get a group rate. Reply IN to commit.",
      targetDate: "Fall 2026",
      minHomes: 8,
      soloPrice: 200,
      groupPrice: 160,
      providerId: gutterPros.id,
      status: "collecting",
    },
  });
  for (const u of [you, priya, marcus, dana, sam]) {
    await prisma.groupDealCommitment.create({ data: { dealId: gutterDeal.id, userId: u.id } });
  }

  const lawnDeal = await prisma.groupDeal.create({
    data: {
      title: "Spring 2026 lawn aeration & overseed",
      categoryId: categories["lawn-care-landscaping"].id,
      neighborhoodId: corbett.id,
      organizerId: priya.id,
      description: "Bundle aeration + overseed across the neighborhood for a discount.",
      targetDate: "Spring 2026",
      minHomes: 6,
      soloPrice: 150,
      status: "collecting",
    },
  });
  for (const u of [priya, jordan]) {
    await prisma.groupDealCommitment.create({ data: { dealId: lawnDeal.id, userId: u.id } });
  }

  // --- Q&A ---------------------------------------------------------------
  const post1 = await prisma.askPost.create({
    data: {
      title: "Who do you use for gutter cleaning?",
      body: "Looking for a decent gutter cleaning company before fall. 2-story, ~2500 sqft.",
      neighborhoodId: corbett.id,
      authorId: you.id,
    },
  });
  await prisma.askReply.create({
    data: {
      postId: post1.id,
      authorId: priya.id,
      body: "Used Triangle Gutter Pros last fall — $175 for our 2-story. Recommend!",
    },
  });
  await prisma.askReply.create({
    data: {
      postId: post1.id,
      authorId: dana.id,
      body: "Chatham Gutter Co. was a bit cheaper at $160 but no guard service.",
    },
  });

  await prisma.askPost.create({
    data: {
      title: "Price check: pressure washing driveway + siding?",
      body: "What did everyone pay? Trying to benchmark before booking.",
      neighborhoodId: corbett.id,
      authorId: marcus.id,
    },
  });

  console.log("Seed complete.");
  console.log("Login with: alex@corbett.test / password123 (admin)");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
