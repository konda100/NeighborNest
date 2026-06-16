import { beforeEach, describe, expect, it } from "vitest";
import { agent, auth, login, neighborhoodId, resetDb } from "./helpers.js";

beforeEach(resetDb);

describe("providers directory & recommendations", () => {
  it("ranks gutter providers in Corbett Landing with neighbor-scoped stats", async () => {
    const corbett = await neighborhoodId("corbett-landing");
    const res = await agent().get(
      `/api/providers?neighborhoodId=${corbett}&categorySlug=gutter-cleaning&scope=neighborhood`
    );
    expect(res.status).toBe(200);
    const names = res.body.providers.map((p: any) => p.name);
    expect(names).toContain("Triangle Gutter Pros");

    const top = res.body.providers[0];
    // Top provider should be the most-recommended (Triangle Gutter Pros = 4 neighbors in seed).
    expect(top.name).toBe("Triangle Gutter Pros");
    expect(top.stats.neighborCount).toBe(4);
    expect(top.stats.recommendationCount).toBe(4);
    expect(top.stats.avgRating).toBeGreaterThan(4);
  });

  it("widens the neighbor count when scope expands to the city", async () => {
    const corbett = await neighborhoodId("corbett-landing");

    const hood = await agent().get(
      `/api/providers?neighborhoodId=${corbett}&categorySlug=gutter-cleaning&scope=neighborhood`
    );
    const city = await agent().get(
      `/api/providers?neighborhoodId=${corbett}&categorySlug=gutter-cleaning&scope=city`
    );

    const hoodTGP = hood.body.providers.find((p: any) => p.name === "Triangle Gutter Pros");
    const cityTGP = city.body.providers.find((p: any) => p.name === "Triangle Gutter Pros");

    // Fearrington adds one more recommendation at the city scope.
    expect(hoodTGP.stats.neighborCount).toBe(4);
    expect(cityTGP.stats.neighborCount).toBe(5);
  });

  it("only surfaces providers neighbors actually used when scoped", async () => {
    const corbett = await neighborhoodId("corbett-landing");
    const res = await agent().get(
      `/api/providers?neighborhoodId=${corbett}&scope=neighborhood`
    );
    // Every returned provider must have at least one in-scope recommendation.
    for (const p of res.body.providers) {
      expect(p.stats.recommendationCount).toBeGreaterThan(0);
    }
  });

  it("filters by search term", async () => {
    const corbett = await neighborhoodId("corbett-landing");
    const res = await agent().get(
      `/api/providers?neighborhoodId=${corbett}&scope=all&search=GreenScape`
    );
    expect(res.body.providers.length).toBe(1);
    expect(res.body.providers[0].name).toBe("GreenScape Lawn Care");
  });

  it("adding a recommendation creates a new provider and surfaces it", async () => {
    const token = await login("alex@corbett.test");
    const corbett = await neighborhoodId("corbett-landing");

    const create = await agent()
      .post("/api/recommendations")
      .set(auth(token))
      .send({
        providerName: "Acme Window Washing",
        categorySlug: "house-cleaning",
        rating: 5,
        pricePaid: "$90",
        comment: "Sparkling",
      });
    expect(create.status).toBe(201);

    const list = await agent().get(
      `/api/providers?neighborhoodId=${corbett}&scope=neighborhood&search=Acme`
    );
    expect(list.body.providers.length).toBe(1);
    expect(list.body.providers[0].stats.neighborCount).toBe(1);
  });

  it("upserts (does not duplicate) when the same author re-reviews the same provider+category", async () => {
    const token = await login("alex@corbett.test");
    const corbett = await neighborhoodId("corbett-landing");

    const first = await agent()
      .post("/api/recommendations")
      .set(auth(token))
      .send({ providerName: "Solo Test Co", categorySlug: "pest-control", rating: 3 });
    expect(first.status).toBe(201);

    await agent()
      .post("/api/recommendations")
      .set(auth(token))
      .send({ providerName: "Solo Test Co", categorySlug: "pest-control", rating: 5 });

    const list = await agent().get(
      `/api/providers?neighborhoodId=${corbett}&scope=neighborhood&search=Solo Test Co`
    );
    expect(list.body.providers.length).toBe(1);
    // Still a single recommendation, now updated to rating 5.
    expect(list.body.providers[0].stats.recommendationCount).toBe(1);
    expect(list.body.providers[0].stats.avgRating).toBe(5);
  });

  it("requires auth to add a recommendation", async () => {
    const res = await agent()
      .post("/api/recommendations")
      .send({ providerName: "No Auth Co", categorySlug: "hvac-service", rating: 4 });
    expect(res.status).toBe(401);
  });

  it("returns provider detail with reviews and scoped stats", async () => {
    const corbett = await neighborhoodId("corbett-landing");
    const list = await agent().get(
      `/api/providers?neighborhoodId=${corbett}&categorySlug=gutter-cleaning&scope=neighborhood`
    );
    const id = list.body.providers[0].id;

    const detail = await agent().get(`/api/providers/${id}?neighborhoodId=${corbett}`);
    expect(detail.status).toBe(200);
    expect(detail.body.provider.recommendations.length).toBeGreaterThan(0);
    expect(detail.body.provider.scopedStats.neighborCount).toBe(4);
  });
});
