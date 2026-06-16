import { beforeEach, describe, expect, it } from "vitest";
import { agent, neighborhoodId, resetDb } from "./helpers.js";

beforeEach(resetDb);

describe("neighborhood dashboard stats", () => {
  it("returns headline numbers for the hub", async () => {
    const corbett = await neighborhoodId("corbett-landing");
    const res = await agent().get(`/api/stats/neighborhood/${corbett}`);
    expect(res.status).toBe(200);

    const s = res.body.stats;
    expect(s.homeCount).toBe(40);
    expect(s.residents).toBeGreaterThanOrEqual(6);
    expect(s.providers).toBeGreaterThan(0);
    expect(s.recommendations).toBeGreaterThan(0);
    expect(s.askPosts).toBeGreaterThanOrEqual(2);
    expect(s.activeDeals).toBeGreaterThanOrEqual(1);
  });

  it("404s for an unknown neighborhood", async () => {
    const res = await agent().get(`/api/stats/neighborhood/does-not-exist`);
    expect(res.status).toBe(404);
  });
});
