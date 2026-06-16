import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/prisma.js";
import { seed } from "../prisma/seed.js";

/** Wipes all rows (FK-safe order) and re-seeds the deterministic demo data. */
export async function resetDb() {
  await prisma.askReply.deleteMany();
  await prisma.askPost.deleteMany();
  await prisma.groupDealCommitment.deleteMany();
  await prisma.groupDeal.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.recommendation.deleteMany();
  await prisma.providerCategory.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.serviceCategory.deleteMany();
  await prisma.user.deleteMany();
  await prisma.neighborhood.deleteMany();
  await prisma.city.deleteMany();
  await prisma.county.deleteMany();
  await prisma.state.deleteMany();
  await seed(prisma);
}

export { app, prisma };

export const agent = () => request(app);

/** Logs in a seeded user and returns their JWT. */
export async function login(email: string, password = "password123"): Promise<string> {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  if (res.status !== 200) {
    throw new Error(`login failed for ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.token as string;
}

export function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

/** Resolves a neighborhood id by slug. */
export async function neighborhoodId(slug: string): Promise<string> {
  const n = await prisma.neighborhood.findUnique({ where: { slug } });
  if (!n) throw new Error(`neighborhood ${slug} not found`);
  return n.id;
}
