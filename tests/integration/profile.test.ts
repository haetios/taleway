import { describe, expect, it, beforeAll } from "vitest";
import { createTestUser, post, type TestUser } from "../helpers/auth";
import { request } from "../helpers/http";

/** Crée une story et retourne son slug. */
async function createStory(title: string, cookie: string): Promise<string> {
  const { res, json } = await post("/api/story", { title }, cookie);
  if (res.status !== 201) throw new Error(`createStory échoué: ${res.status}`);
  return json.data.slug as string;
}

describe("GET /api/profile/[id]", () => {
  it("400 — id non-uuid", async () => {
    const { res } = await request("/api/profile/pas-un-uuid", "GET");
    expect(res.status).toBe(400);
  });

  it("404 — uuid valide mais profil inexistant", async () => {
    const { res } = await request(
      "/api/profile/00000000-0000-4000-8000-000000000000",
      "GET"
    );
    expect(res.status).toBe(404);
  });
});

describe("GET /api/profile/[id] — profil existant", () => {
  let user: TestUser;
  let profileId: string;

  beforeAll(async () => {
    user = await createTestUser("profpub");
    // Pas d'endpoint "me" : on récupère profileId via une story créée par user
    // (PUT /stories/[slug] renvoie la row complète, profileId inclus)
    const { json } = await post("/api/story", { title: `Id carrier ${user.username}` }, user.cookie);
    const slug = json.data.slug as string;
    const { res, json: storyJson } = await request(`/api/story/${slug}`, "PUT", { status: "published" }, user.cookie);
    expect(res.status).toBe(200);
    profileId = storyJson.data.profileId as string;
  });

  it("200 — profil public accessible sans session, avec username et bio", async () => {
    const { res, json } = await request(`/api/profile/${profileId}`, "GET");
    expect(res.status).toBe(200);
    expect(json.data.id).toBe(profileId);
    expect(json.data.username).toBe(user.username);
  });
});

describe("GET /api/profile/stories", () => {
  let user: TestUser;
  let otherUser: TestUser;

  beforeAll(async () => {
    user = await createTestUser("mystories");
    otherUser = await createTestUser("otherstories");

    // Fixtures : 1 draft, 1 published, 1 archived (soft delete) pour user
    const draftSlug = await createStory(`Draft ${user.username}`, user.cookie);
    void draftSlug;

    const pubSlug = await createStory(`Publiée ${user.username}`, user.cookie);
    const { res: pubRes } = await request(`/api/story/${pubSlug}`, "PUT", { status: "published" }, user.cookie);
    expect(pubRes.status).toBe(200);

    const archSlug = await createStory(`Archivée ${user.username}`, user.cookie);
    const { res: delRes } = await request(`/api/story/${archSlug}`, "DELETE", undefined, user.cookie);
    expect(delRes.status).toBe(204);

    // Une story d'un autre auteur, non listée
    await createStory(`Story à moi ${otherUser.username}`, otherUser.cookie);
  });

  it("401 — sans session", async () => {
    const { res } = await request("/api/profile/stories", "GET");
    expect(res.status).toBe(401);
  });

  it("200 — ses stories : draft + published visibles, archived exclue, stories d'autrui absentes", async () => {
    const { res, json } = await request("/api/profile/stories", "GET", undefined, user.cookie);
    expect(res.status).toBe(200);
    const titles: string[] = json.data.map((s: { title: string }) => s.title);
    expect(titles).toContain(`Draft ${user.username}`);
    expect(titles).toContain(`Publiée ${user.username}`);
    expect(titles).not.toContain(`Archivée ${user.username}`);
    expect(titles).not.toContain(`Story à moi ${otherUser.username}`);
  });

  it("200 — pas de graphe exposé dans les items", async () => {
    const { json } = await request("/api/profile/stories", "GET", undefined, user.cookie);
    for (const story of json.data) {
      expect(story.graph).toBeUndefined();
    }
  });
});

describe("GET/PUT /api/profile/settings", () => {
  let user: TestUser;

  beforeAll(async () => {
    user = await createTestUser("settings");
  });

  it("401 — GET sans session", async () => {
    const { res } = await request("/api/profile/settings", "GET");
    expect(res.status).toBe(401);
  });

  it("401 — PUT sans session", async () => {
    const { res } = await request("/api/profile/settings", "PUT", { bio: "Salut" });
    expect(res.status).toBe(401);
  });

  it("200 — GET renvoie email, username, bio", async () => {
    const { res, json } = await request("/api/profile/settings", "GET", undefined, user.cookie);
    expect(res.status).toBe(200);
    expect(json.data.email).toBe(user.email);
    expect(json.data.username).toBe(user.username);
    expect(json.data.bio).toBeNull();
  });

  it("400 — PUT avec body vide", async () => {
    const { res } = await request("/api/profile/settings", "PUT", {}, user.cookie);
    expect(res.status).toBe(400);
  });

  it("204 → 200 — PUT bio seule, puis GET confirme", async () => {
    const { res: putRes } = await request(
      "/api/profile/settings",
      "PUT",
      { bio: "Nouvelle bio de test" },
      user.cookie
    );
    expect([200, 204]).toContain(putRes.status);

    const { res: getRes, json } = await request("/api/profile/settings", "GET", undefined, user.cookie);
    expect(getRes.status).toBe(200);
    expect(json.data.bio).toBe("Nouvelle bio de test");
  });

  it("409 — PUT vers un username déjà pris", async () => {
    const other = await createTestUser("settingsother");

    const { res } = await request(
      "/api/profile/settings",
      "PUT",
      { username: other.username },
      user.cookie
    );
    expect(res.status).toBe(409);
  });
});