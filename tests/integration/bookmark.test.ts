import { describe, expect, it, beforeAll } from "vitest";
import { createTestUser, post, type TestUser } from "../helpers/auth";
import { request } from "../helpers/http";
import { insertBookmark } from "../helpers/db";

/** Récupère le profileId d'un user via une story qu'il possède (PUT renvoie la row). */
async function getProfileId(user: TestUser): Promise<string> {
  const { json } = await post("/api/story", { title: `Id ${user.username} ${Date.now()}` }, user.cookie);
  const slug = json.data.slug as string;
  const { json: storyJson } = await request(`/api/story/${slug}`, "PUT", { blurb: "x" }, user.cookie);
  return storyJson.data.profileId as string;
}

/** Crée une story publiée et retourne { slug, storyId, profileId } (du créateur). */
async function createPublishedStory(cookie: string, title: string) {
  const { json } = await post("/api/story", { title }, cookie);
  const slug = json.data.slug as string;
  const { res, json: storyJson } = await request(`/api/story/${slug}`, "PUT", { status: "published" }, cookie);
  expect(res.status).toBe(200);
  return {
    slug,
    storyId: storyJson.data.id as number,
    profileId: storyJson.data.profileId as string,
  };
}

// closeSql inutile : vitest termine le process (la connexion SQL meurt avec).
// (Un afterAll ici fermerait le singleton pendant que l'autre describe l'utilise.)

describe("POST /api/bookmark (upsert)", () => {
  let reader: TestUser;
  let author: TestUser;

  beforeAll(async () => {
    reader = await createTestUser("bmpost");
    author = await createTestUser("bmpostauthor");
  });

  it("400 — payload invalide (nodeId manquant)", async () => {
    const { res } = await post("/api/bookmark", { slug: "quelconque-234567" }, reader.cookie);
    expect(res.status).toBe(400);
  });

  it("401 — sans session", async () => {
    const { res } = await post("/api/bookmark", { slug: "quelconque-234567", nodeId: "node-1", variables: {} });
    expect(res.status).toBe(401);
  });

  it("404 — story inconnue (fusionnel)", async () => {
    const { res } = await post(
      "/api/bookmark",
      { slug: "inexistant-234567", nodeId: "node-1", variables: {} },
      reader.cookie
    );
    expect(res.status).toBe(404);
  });

  it("200 — création implicite puis mise à jour (upsert), lisible au GET", async () => {
    const { slug } = await createPublishedStory(author.cookie, `Upsert ${author.username}`);

    // 1er POST → le bookmark n'existe pas → upsert le crée
    const { res: post1 } = await post(
      "/api/bookmark",
      { slug, nodeId: "node-a", variables: { confiance: 10 } },
      reader.cookie
    );
    expect(post1.status).toBe(200);

    // GET confirme la position sauvegardée
    const { res: get1, json: getJson1 } = await request(`/api/bookmark/${slug}`, "GET", undefined, reader.cookie);
    expect(get1.status).toBe(200);
    expect(getJson1.data.nodeId).toBe("node-a");
    expect(getJson1.data.variables).toEqual({ confiance: 10 });

    // 2e POST → le bookmark existe → upsert le met à jour
    const { res: post2 } = await post(
      "/api/bookmark",
      { slug, nodeId: "node-b", variables: { confiance: 20 } },
      reader.cookie
    );
    expect(post2.status).toBe(200);

    // GET confirme la nouvelle position
    const { res: get2, json: getJson2 } = await request(`/api/bookmark/${slug}`, "GET", undefined, reader.cookie);
    expect(get2.status).toBe(200);
    expect(getJson2.data.nodeId).toBe("node-b");
    expect(getJson2.data.variables).toEqual({ confiance: 20 });
  });

  it("404 — bookmark refusé sur un draft d'autrui (non published)", async () => {
    // Draft jamais publié par son auteur
    const { json } = await post("/api/story", { title: `Draft caché ${author.username}` }, author.cookie);
    const draftSlug = json.data.slug as string;

    const { res } = await post(
      "/api/bookmark",
      { slug: draftSlug, nodeId: "node-1", variables: {} },
      reader.cookie
    );
    expect(res.status).toBe(404);
  });

  it("429 — rate limit dépassé (61e sauvegarde dans la minute, limite à 60)", async () => {
    // User dédié + story dédiée (fixtures à part pour ne pas polluer les autres tests)
    const rl = await createTestUser("bmratelimit");
    const rlAuthor = await createTestUser("bmratelimitauth");
    const { slug } = await createPublishedStory(rlAuthor.cookie, `RL bookmark ${rlAuthor.username}`);

    for (let i = 0; i < 61; i++) {
      const { res } = await post(
        "/api/bookmark",
        { slug, nodeId: `node-${i}`, variables: {} },
        rl.cookie
      );
      if (i < 60) {
        expect(res.status).toBe(200);
      } else {
        expect(res.status).toBe(429);
        expect(res.headers.get("retry-after")).not.toBeNull();
      }
    }
  });

  it("isolation — le bookmark d'un lecteur n'apparaît pas chez un autre", async () => {
    const { slug } = await createPublishedStory(author.cookie, `Iso bookmark ${author.username}`);
    const otherReader = await createTestUser("bmiso");

    await post("/api/bookmark", { slug, nodeId: "node-x" }, reader.cookie);

    // reader a un bookmark, otherReader non
    const { res: getOther } = await request(`/api/bookmark/${slug}`, "GET", undefined, otherReader.cookie);
    expect(getOther.status).toBe(404);

    // La mise à jour par reader ne touche pas otherReader (le sien reste absent)
    await post("/api/bookmark", { slug, nodeId: "node-y" }, reader.cookie);
    const { res: getOtherAfter } = await request(`/api/bookmark/${slug}`, "GET", undefined, otherReader.cookie);
    expect(getOtherAfter.status).toBe(404);
  });
});

describe("GET /api/bookmark/[slug]", () => {
  let user: TestUser;
  let author: TestUser;
  let slug: string;
  let storyId: number;
  const NODE_ID = "node-42";

  beforeAll(async () => {
    user = await createTestUser("bmreader");
    author = await createTestUser("bmauthor");
    const s = await createPublishedStory(author.cookie, `Lecture bookmark ${author.username}`);
    slug = s.slug;
    storyId = s.storyId;
    // Fixture directe : le POST /bookmark n'existe pas encore (TDD).
    // Le bookmark appartient au LECTEUR (user) sur la story de l'AUTEUR.
    await insertBookmark(await getProfileId(user), storyId, NODE_ID);
  });

  it("200 — bookmark existant : node_id et storyId corrects", async () => {
    const { res, json } = await request(`/api/bookmark/${slug}`, "GET", undefined, user.cookie);
    expect(res.status).toBe(200);
    expect(json.data.nodeId).toBe(NODE_ID);
    expect(json.data.storyId).toBe(storyId);
  });

  it("404 — pas de bookmark pour cette story", async () => {
    const other = await createTestUser("bmnobookmark");
    const { res } = await request(`/api/bookmark/${slug}`, "GET", undefined, other.cookie);
    expect(res.status).toBe(404);
  });

  it("404 — story inconnue (fusionnel)", async () => {
    const { res } = await request("/api/bookmark/inexistant-x4f9k2", "GET", undefined, user.cookie);
    expect(res.status).toBe(404);
  });

  it("401 — sans session", async () => {
    const { res } = await request(`/api/bookmark/${slug}`, "GET");
    expect(res.status).toBe(401);
  });

  it("400 — slug malformé", async () => {
    const { res } = await request("/api/bookmark/INVALIDE", "GET", undefined, user.cookie);
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/bookmark/[slug]", () => {
  let user: TestUser;
  let author: TestUser;

  beforeAll(async () => {
    user = await createTestUser("bmdel");
    author = await createTestUser("bmdelauthor");
  });

  it("cycle — suppression puis re-GET 404, re-DELETE 404", async () => {
    const s = await createPublishedStory(author.cookie, `À effacer ${author.username}`);
    await insertBookmark(await getProfileId(user), s.storyId, "node-1");

    // Existe
    const { res: get1 } = await request(`/api/bookmark/${s.slug}`, "GET", undefined, user.cookie);
    expect(get1.status).toBe(200);

    // Suppression → 204
    const { res: del1 } = await request(`/api/bookmark/${s.slug}`, "DELETE", undefined, user.cookie);
    expect(del1.status).toBe(204);

    // Re-GET → 404
    const { res: get2 } = await request(`/api/bookmark/${s.slug}`, "GET", undefined, user.cookie);
    expect(get2.status).toBe(404);

    // Re-DELETE → 404 (le bookmark n'existe plus)
    const { res: del2 } = await request(`/api/bookmark/${s.slug}`, "DELETE", undefined, user.cookie);
    expect(del2.status).toBe(404);
  });

  it("401 — sans session", async () => {
    const { res } = await request("/api/bookmark/quelconque-x4f9k2", "DELETE");
    expect(res.status).toBe(401);
  });

  it("400 — slug malformé", async () => {
    const { res } = await request("/api/bookmark/INVALIDE", "DELETE", undefined, user.cookie);
    expect(res.status).toBe(400);
  });

  it("404 — story inconnue (fusionnel)", async () => {
    const { res } = await request("/api/bookmark/inexistant-x4f9k2", "DELETE", undefined, user.cookie);
    expect(res.status).toBe(404);
  });
});