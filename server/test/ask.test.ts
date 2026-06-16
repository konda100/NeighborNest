import { beforeEach, describe, expect, it } from "vitest";
import { agent, auth, login, neighborhoodId, resetDb } from "./helpers.js";

beforeEach(resetDb);

describe("ask neighbors (Q&A)", () => {
  it("lists seeded posts with replies for a neighborhood", async () => {
    const corbett = await neighborhoodId("corbett-landing");
    const res = await agent().get(`/api/ask?neighborhoodId=${corbett}`);
    expect(res.status).toBe(200);
    expect(res.body.posts.length).toBeGreaterThanOrEqual(2);

    const gutterQ = res.body.posts.find((p: any) => p.title.includes("gutter cleaning"));
    expect(gutterQ).toBeTruthy();
    expect(gutterQ.replies.length).toBe(2);
  });

  it("searches posts by title", async () => {
    const corbett = await neighborhoodId("corbett-landing");
    const res = await agent().get(`/api/ask?neighborhoodId=${corbett}&search=pressure`);
    expect(res.body.posts.length).toBe(1);
    expect(res.body.posts[0].title.toLowerCase()).toContain("pressure");
  });

  it("creates a post (defaults to the author's neighborhood)", async () => {
    const token = await login("sam@corbett.test");
    const res = await agent()
      .post("/api/ask")
      .set(auth(token))
      .send({ title: "Best electrician?", body: "Need a panel upgrade." });
    expect(res.status).toBe(201);
    expect(res.body.post.title).toBe("Best electrician?");
    expect(res.body.post.neighborhood.name).toBe("Corbett Landing");
  });

  it("adds a reply to a post", async () => {
    const corbett = await neighborhoodId("corbett-landing");
    const list = await agent().get(`/api/ask?neighborhoodId=${corbett}`);
    const postId = list.body.posts[0].id;

    const token = await login("dana@corbett.test");
    const res = await agent()
      .post(`/api/ask/${postId}/replies`)
      .set(auth(token))
      .send({ body: "I used ClearSky and they were great." });
    expect(res.status).toBe(201);
    expect(res.body.reply.body).toContain("ClearSky");
    expect(res.body.reply.author.name).toBe("Dana Wright");
  });

  it("requires auth to post or reply", async () => {
    const post = await agent().post("/api/ask").send({ title: "x" });
    expect(post.status).toBe(401);
  });
});
