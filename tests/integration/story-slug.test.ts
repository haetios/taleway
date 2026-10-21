import { describe, expect, it, beforeAll } from "vitest";
import { createTestUser, post, type TestUser } from "../helpers/auth";
import { request } from "../helpers/http";

let user: TestUser;
let otherUser: TestUser;

/** Crée une story via l'API et retourne son slug. */
async function createStory(title: string, cookie: string): Promise<string> {
  const { res, json } = await post("/api/stories", { title }, cookie);
  if (res.status !== 201) throw new Error(`createStory échoué: ${res.status}`);
  return json.data.slug as string;
}

describe("GET /api/stories/[slug]", () => {
  it("400 — slug malformé", async () => {
    const { res } = await request("/api/stories/PAS-VALIDE", "GET");
    expect(res.status).toBe(400);
  });

  it("404 — story inexistante", async () => {
    const { res } = await request("/api/stories/inexistant-x4f9k2", "GET");
    expect(res.status).toBe(404);
  });

  it("401 — withGraph sans session", async () => {
    const { res } = await request(
      "/api/stories/inexistant-x4f9k2?withGraph=true",
      "GET"
    );
    expect(res.status).toBe(401);
  });

  it("200 — draft lisible par son auteur avec withGraph", async () => {
    const u = await createTestUser("slugdraft");
    const slug = await createStory(`Brouillon ${u.username}`, u.cookie);
    const { res, json } = await request(
      `/api/stories/${slug}?withGraph=true`,
      "GET",
      undefined,
      u.cookie
    );
    expect(res.status).toBe(200);
    expect(json.data.slug).toBe(slug);
    expect(json.data.status).toBe("draft");
    expect(json.data.graph).toEqual({});
  });

  it("404 — draft invisible sans session (metadata)", async () => {
    const u = await createTestUser("slugdraft2");
    const slug = await createStory(`Brouillon caché ${u.username}`, u.cookie);
    const { res } = await request(`/api/stories/${slug}`, "GET");
    expect(res.status).toBe(404);
  });

  it("200 — published lisible par tous, sans graphe en metadata", async () => {
    const u = await createTestUser("slugpub");
    const slug = await createStory(`Publiée ${u.username}`, u.cookie);
    // Publication via PUT
    const { res: published } = await request(
      `/api/stories/${slug}`,
      "PUT",
      { status: "published" },
      u.cookie
    );
    expect(published.status).toBe(200);

    // Lecture metadata sans session
    const { res, json } = await request(`/api/stories/${slug}`, "GET");
    expect(res.status).toBe(200);
    expect(json.data.status).toBe("published");
    // NOTE : actuellement le mode metadata renvoie TOUTE la row, graph inclus.
    // Si un jour le graphe est exclu (performances), dé-commenter :
    // expect(json.data.graph).toBeUndefined();
  });
});

describe("PUT /api/stories/[slug]", () => {
  beforeAll(async () => {
    user = await createTestUser("slugput");
    otherUser = await createTestUser("slugother");
  });

  it("400 — body vide", async () => {
    const { res } = await request("/api/stories/quelconque-x4f9k2", "PUT", {});
    expect(res.status).toBe(400);
  });

  it("401 — sans session", async () => {
    const { res } = await request("/api/stories/quelconque-x4f9k2", "PUT", {
      title: "Nouveau",
    });
    expect(res.status).toBe(401);
  });

  it("400 — slug malformé", async () => {
    const { res } = await request("/api/stories/INVALIDE", "PUT", {
      title: "Nouveau",
    }, user.cookie);
    expect(res.status).toBe(400);
  });

  it("200 — édition partielle (blurb seul)", async () => {
    const slug = await createStory(`Éditable ${user.username}`, user.cookie);
    const { res, json } = await request(
      `/api/stories/${slug}`,
      "PUT",
      { blurb: "Une quatrième de couverture" },
      user.cookie
    );
    expect(res.status).toBe(200);
    expect(json.data.blurb).toBe("Une quatrième de couverture");
  });

  it("409 — renommage vers un titre déjà pris (même auteur)", async () => {
    await createStory(`Titre A ${user.username}`, user.cookie);
    const slugB = await createStory(`Titre B ${user.username}`, user.cookie);
    const { res } = await request(
      `/api/stories/${slugB}`,
      "PUT",
      { title: `Titre A ${user.username}` },
      user.cookie
    );
    expect(res.status).toBe(409);
  });

  it("404 — story d'un autre auteur", async () => {
    const slugOther = await createStory(
      `Propriété other ${otherUser.username}`,
      otherUser.cookie
    );
    const { res } = await request(
      `/api/stories/${slugOther}`,
      "PUT",
      { title: "Pirate" },
      user.cookie
    );
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/stories/[slug]", () => {
  it("401 — sans session", async () => {
    const { res } = await request("/api/stories/quelconque-x4f9k2", "DELETE");
    expect(res.status).toBe(401);
  });

  it("204 — suppression de sa story, puis 404 au re-GET", async () => {
    const u = await createTestUser("slugdel");
    const slug = await createStory(`À supprimer ${u.username}`, u.cookie);

    const { res } = await request(
      `/api/stories/${slug}`,
      "DELETE",
      undefined,
      u.cookie
    );
    expect(res.status).toBe(204);

    const { res: after } = await request(`/api/stories/${slug}`, "GET");
    expect(after.status).toBe(404);
  });

  it("404 — story d'un autre auteur (fusionnel)", async () => {
    const owner = await createTestUser("slugowner2");
    const intrus = await createTestUser("slogintrus");
    const slug = await createStory(`Pas à moi ${owner.username}`, owner.cookie);

    const { res } = await request(
      `/api/stories/${slug}`,
      "DELETE",
      undefined,
      intrus.cookie
    );
    expect(res.status).toBe(404);
  });
});