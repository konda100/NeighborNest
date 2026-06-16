import { beforeEach, describe, expect, it } from "vitest";
import { agent, auth, login, neighborhoodId, resetDb } from "./helpers.js";

beforeEach(resetDb);

async function gutterDeal(corbett: string) {
  const res = await agent().get(`/api/deals?neighborhoodId=${corbett}`);
  return res.body.deals.find((d: any) => d.title.includes("Gutter"));
}

describe("group deals", () => {
  it("lists seeded deals with progress and savings math", async () => {
    const corbett = await neighborhoodId("corbett-landing");
    const deal = await gutterDeal(corbett);

    expect(deal).toBeTruthy();
    expect(deal.committedHomes).toBe(5); // 5 seeded commitments
    expect(deal.minHomes).toBe(8);
    expect(deal.criticalMassReached).toBe(false);
    // soloPrice 200, groupPrice 160 -> $40/home, x5 committed = $200.
    expect(deal.savingsPerHome).toBe(40);
    expect(deal.totalCommunitySavings).toBe(200);
    expect(deal.progress).toBeCloseTo(5 / 8, 5);
  });

  it("creates a deal and auto-commits the organizer", async () => {
    const token = await login("marcus@corbett.test");
    const res = await agent()
      .post("/api/deals")
      .set(auth(token))
      .send({
        title: "Winter pressure washing",
        categorySlug: "pressure-washing",
        minHomes: 5,
        soloPrice: 250,
        targetDate: "Winter 2026",
      });
    expect(res.status).toBe(201);
    expect(res.body.deal.committedHomes).toBe(1);
    expect(res.body.deal.iCommitted).toBe(true);
    expect(res.body.deal.organizer.name).toBe("Marcus Lee");
  });

  it("toggles a commitment on and off and updates the count", async () => {
    const corbett = await neighborhoodId("corbett-landing");
    const token = await login("jordan@corbett.test"); // not committed in seed
    const deal = await gutterDeal(corbett);

    const join = await agent().post(`/api/deals/${deal.id}/commit`).set(auth(token));
    expect(join.body.deal.committedHomes).toBe(6);
    expect(join.body.deal.iCommitted).toBe(true);
    expect(join.body.deal.totalCommunitySavings).toBe(240); // $40 x 6

    const leave = await agent().post(`/api/deals/${deal.id}/commit`).set(auth(token));
    expect(leave.body.deal.committedHomes).toBe(5);
    expect(leave.body.deal.iCommitted).toBe(false);
  });

  it("reaches critical mass once enough homes commit", async () => {
    const corbett = await neighborhoodId("corbett-landing");
    const deal = await gutterDeal(corbett);

    // Three more commitments (jordan + two fresh registrations) -> 8 total.
    const jordan = await login("jordan@corbett.test");
    await agent().post(`/api/deals/${deal.id}/commit`).set(auth(jordan));

    for (const n of [1, 2]) {
      const reg = await agent()
        .post("/api/auth/register")
        .send({
          name: `Committer ${n}`,
          email: `committer${n}@test.dev`,
          password: "secret123",
          neighborhoodId: corbett,
        });
      await agent().post(`/api/deals/${deal.id}/commit`).set(auth(reg.body.token));
    }

    const final = await gutterDeal(corbett);
    expect(final.committedHomes).toBe(8);
    expect(final.criticalMassReached).toBe(true);
  });

  it("lets the organizer set the negotiated price and status", async () => {
    const corbett = await neighborhoodId("corbett-landing");
    const organizer = await login("alex@corbett.test"); // organizer of the gutter deal
    const deal = await gutterDeal(corbett);

    const res = await agent()
      .patch(`/api/deals/${deal.id}`)
      .set(auth(organizer))
      .send({ groupPrice: 150, status: "confirmed" });
    expect(res.status).toBe(200);
    expect(res.body.deal.groupPrice).toBe(150);
    expect(res.body.deal.savingsPerHome).toBe(50); // 200 - 150
    expect(res.body.deal.status).toBe("confirmed");
  });

  it("forbids non-organizers from updating a deal", async () => {
    const corbett = await neighborhoodId("corbett-landing");
    const notOrganizer = await login("dana@corbett.test");
    const deal = await gutterDeal(corbett);

    const res = await agent()
      .patch(`/api/deals/${deal.id}`)
      .set(auth(notOrganizer))
      .send({ groupPrice: 1 });
    expect(res.status).toBe(403);
  });

  it("requires auth to commit", async () => {
    const corbett = await neighborhoodId("corbett-landing");
    const deal = await gutterDeal(corbett);
    const res = await agent().post(`/api/deals/${deal.id}/commit`);
    expect(res.status).toBe(401);
  });
});
