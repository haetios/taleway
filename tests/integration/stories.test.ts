import { describe, expect, it, beforeAll } from "vitest";
import { createTestUser, post, type TestUser } from "../helpers/auth";

let user: TestUser;

describe("POST /api/stories", () => {
  beforeAll(async () => {
    // Utilisateur isolé pour cette suite : rejouable seul(e) ou avec les autres
    user = await createTestUser("stories");
  });

  it("400 — titre manquant", async () => {
    const { res } = await post("/api/stories", { title: "" }, user.cookie);
    expect(res.status).toBe(400);
  });

  it("401 — sans session", async () => {
    const { res } = await post("/api/stories", { title: "Sans session" });
    expect(res.status).toBe(401);
  });

  it("201 — crée l'histoire", async () => {
    const { res } = await post(
      "/api/stories",
      { title: `Le pouvoir de demain ${user.username}` },
      user.cookie
    );
    expect(res.status).toBe(201);
  });

  it("409 — même titre pour le même auteur", async () => {
    const title = `Conflit ${user.username}`;
    await post("/api/stories", { title }, user.cookie);
    const { res } = await post("/api/stories", { title }, user.cookie);
    expect(res.status).toBe(409);
  });
});