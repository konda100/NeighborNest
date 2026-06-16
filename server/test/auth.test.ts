import { beforeEach, describe, expect, it } from "vitest";
import { agent, auth, login, neighborhoodId, resetDb } from "./helpers.js";

beforeEach(resetDb);

describe("auth", () => {
  it("registers a new user and returns a token + neighborhood", async () => {
    const corbett = await neighborhoodId("corbett-landing");
    const res = await agent()
      .post("/api/auth/register")
      .send({
        name: "New Neighbor",
        email: "new.neighbor@test.dev",
        password: "secret123",
        neighborhoodId: corbett,
      });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe("new.neighbor@test.dev");
    expect(res.body.user.neighborhood.name).toBe("Corbett Landing");
    // Password material must never be returned.
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it("rejects duplicate email registration", async () => {
    const res = await agent()
      .post("/api/auth/register")
      .send({ name: "Dup", email: "alex@corbett.test", password: "secret123" });
    expect(res.status).toBe(409);
  });

  it("validates input (bad email, short password)", async () => {
    const res = await agent()
      .post("/api/auth/register")
      .send({ name: "X", email: "not-an-email", password: "123" });
    expect(res.status).toBe(400);
  });

  it("logs in with valid credentials and rejects bad ones", async () => {
    const ok = await agent()
      .post("/api/auth/login")
      .send({ email: "alex@corbett.test", password: "password123" });
    expect(ok.status).toBe(200);
    expect(ok.body.token).toBeTruthy();

    const bad = await agent()
      .post("/api/auth/login")
      .send({ email: "alex@corbett.test", password: "wrong" });
    expect(bad.status).toBe(401);
  });

  it("returns the current user for /me and requires auth", async () => {
    const unauth = await agent().get("/api/auth/me");
    expect(unauth.status).toBe(401);

    const token = await login("alex@corbett.test");
    const res = await agent().get("/api/auth/me").set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("alex@corbett.test");
  });

  it("updates the profile (name + neighborhood)", async () => {
    const token = await login("priya@corbett.test");
    const briar = await neighborhoodId("briar-chapel");
    const res = await agent()
      .patch("/api/auth/me")
      .set(auth(token))
      .send({ name: "Priya N.", neighborhoodId: briar });
    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe("Priya N.");
    expect(res.body.user.neighborhood.name).toBe("Briar Chapel");
  });
});
