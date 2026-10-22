import { describe, expect, it, beforeAll } from "vitest";
import { createTestUser, post, type TestUser } from "../helpers/auth";
import { request } from "../helpers/http";

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

describe("GET /api/stories", () => {
  let publishedSlug: string;
  let unique: string;

  beforeAll(async () => {
    // Fixture : 1 story publiée (filtreable par titre), 1 draft (doit rester invisible)
    unique = `listtest_${Date.now()}`;
    const author = await createTestUser("listauthor");
    const { res: draftRes, json: draftJson } = await post(
      "/api/stories",
      { title: `Draft caché ${unique}` },
      author.cookie
    );
    expect(draftRes.status).toBe(201);
    const draftSlug = draftJson.data.slug as string;
    void draftSlug; // draft : jamais listé, on garde juste la création

    const { json: pubJson } = await post(
      "/api/stories",
      { title: `Publiée ${unique}` },
      author.cookie
    );
    publishedSlug = pubJson.data.slug as string;
    const { res: putRes } = await request(
      `/api/stories/${publishedSlug}`,
      "PUT",
      { status: "published", category: "romance" },
      author.cookie
    );
    expect(putRes.status).toBe(200);
  });

  it("200 — liste sans filtre, contient la publiée sans le draft", async () => {
    const { res, json } = await request("/api/stories", "GET");
    expect(res.status).toBe(200);
    expect(Array.isArray(json.data)).toBe(true);
    const titles: string[] = json.data.map((s: { title: string }) => s.title);
    expect(titles).toContain(`Publiée ${unique}`);
    expect(titles).not.toContain(`Draft caché ${unique}`);
  });

  it("200 — les items n'exposent pas le graphe", async () => {
    const { json } = await request(`/api/stories?title=${unique}`, "GET");
    const item = json.data.find(
      (s: { slug: string }) => s.slug === publishedSlug
    );
    expect(item).toBeDefined();
    expect(item.graph).toBeUndefined();
  });

  it("200 — filtre par titre (LIKE)", async () => {
    const { res, json } = await request(
      `/api/stories?title=${encodeURIComponent(`Publiée ${unique}`)}`,
      "GET"
    );
    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(json.data[0].title).toBe(`Publiée ${unique}`);
  });

  it("200 — filtre par catégorie", async () => {
    const { json } = await request("/api/stories?categories=romance", "GET");
    const titles = json.data.map((s: { title: string }) => s.title);
    expect(titles).toContain(`Publiée ${unique}`);
  });

  it("400 — catégorie invalide", async () => {
    const { res } = await request("/api/stories?categories=pouet", "GET");
    expect(res.status).toBe(400);
  });

  it("200 — filtre vide sur titre → pas de résultat, pas d'erreur", async () => {
    const { res, json } = await request(
      `/api/stories?title=${encodeURIComponent(`zzz-inconnu-${unique}`)}`,
      "GET"
    );
    expect(res.status).toBe(200);
    expect(json.data).toEqual([]);
  });
});