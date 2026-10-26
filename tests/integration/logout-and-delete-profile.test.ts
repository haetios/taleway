/**
 * Tests d'intégration : POST /api/auth/logout et DELETE /api/profile/[id].
 *
 * DELETE /profile/[id] est irréversible et consomme un user GoTrue réel :
 * users uniques par run (createTestUser), jamais d'emails/ids fixes.
 */

import { describe, expect, it, beforeAll } from "vitest";
import { createTestUser, post, sessionCookie, type TestUser } from "../helpers/auth";
import { request } from "../helpers/http";
import { insertBookmark, getUserIdByEmail } from "../helpers/db";
import { getOtpCode } from "../helpers/mailpit";

/** Récupère le profileId d'un user via une story qu'il possède (PUT renvoie la row). */
async function getProfileIdViaStory(user: TestUser): Promise<string> {
  const { json } = await post("/api/story", { title: `Id ${user.username} ${Date.now()}` }, user.cookie);
  const slug = json.data.slug as string;
  const { res, json: storyJson } = await request(`/api/story/${slug}`, "PUT", { blurb: "support" }, user.cookie);
  expect(res.status).toBe(200);
  return storyJson.data.profileId as string;
}

// ---------------------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------------------

describe("POST /api/auth/logout", () => {
  it("401 — sans session", async () => {
    const { res } = await post("/api/auth/logout", {});
    expect(res.status).toBe(401);
  });

  it("200 — session valide invalidée (cookie mort ensuite)", async () => {
    const user = await createTestUser("logout");

    // Logout invalide la session côté serveur (scope local)
    const { res: logoutRes } = await post("/api/auth/logout", {}, user.cookie);
    expect(logoutRes.status).toBe(200);

    // Le cookie ne vaut plus rien : toute requête auth devient 401
    const { res: after } = await request("/api/profile/settings", "GET", undefined, user.cookie);
    expect(after.status).toBe(401);
  });

  it("200 — idempotent : re-logout avec le cookie déjà mort", async () => {
    const user = await createTestUser("relogout");

    await post("/api/auth/logout", {}, user.cookie);
    const { res } = await post("/api/auth/logout", {}, user.cookie);
    expect(res.status).toBe(401); // session morte = plus d'utilisateur authentifié
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/profile/[id]
// ---------------------------------------------------------------------------

describe("DELETE /api/profile/[id]", () => {
  let victim: TestUser; // se fait supprimer son profil
  let attacker: TestUser; // tente de supprimer le profil de victim

  beforeAll(async () => {
    victim = await createTestUser("delvictim");
    attacker = await createTestUser("delattacker");
  });

  it("400 — id non-uuid", async () => {
    const { res } = await request("/api/profile/pas-un-uuid", "DELETE");
    expect(res.status).toBe(400);
  });

  it("401 — sans session", async () => {
    const { res } = await request(
      "/api/profile/00000000-0000-4000-8000-000000000000",
      "DELETE"
    );
    expect(res.status).toBe(401);
  });

  it("403 — id d'un autre profil (auto-suppression uniquement)", async () => {
    const victimId = await getProfileIdViaStory(victim);

    const { res, json } = await request(`/api/profile/${victimId}`, "DELETE", undefined, attacker.cookie);
    expect(res.status).toBe(403);
    expect(json.title).toBe("Forbidden");

    // victim survit : son profil est toujours lisible
    const { res: check } = await request(`/api/profile/${victimId}`, "GET");
    expect(check.status).toBe(200);
  });

  it("204 — auto-suppression : profil, sessions et dépendances nettoyés", async () => {
    // Fixtures : une story (détachée, pas supprimée) + un bookmark (cascade)
    const victimId = await getProfileIdViaStory(victim);
    const { json: storyJson } = await post(
      "/api/story",
      { title: `Survivante ${victim.username} ${Date.now()}` },
      victim.cookie
    );
    const slug = storyJson.data.slug as string;
    await request(`/api/story/${slug}`, "PUT", { status: "published" }, victim.cookie);
    const { json: fullStory } = await request(`/api/story/${slug}`, "GET");
    await insertBookmark(victimId, fullStory.data.id as number, "node-1");

    const { res } = await request(`/api/profile/${victimId}`, "DELETE", undefined, victim.cookie);
    expect(res.status).toBe(204);

    // Le profil n'existe plus
    const { res: gone } = await request(`/api/profile/${victimId}`, "GET");
    expect(gone.status).toBe(404);

    // La session du user supprimé est invalide (user GoTrue mort)
    const { res: session } = await request("/api/profile/settings", "GET", undefined, victim.cookie);
    expect(session.status).toBe(401);

    // La story survit, détachée (profile_id → NULL) et reste publiée
    const { res: storyRes, json: storyAfter } = await request(`/api/story/${slug}`, "GET");
    expect(storyRes.status).toBe(200);
    expect(storyAfter.data.profileId).toBeNull();
  });

  it("404 — user auth sans fiche profil (état #11 : GoTrue tué, 404 renvoyé)", async () => {
    // OTP complet SANS POST /auth/profile → user GoTrue vivant, profil absent.
    const email = `noprofile-${Date.now()}_${Math.random().toString(36).slice(2, 6)}@taleway.dev`;
    await post("/api/auth", { email });
    const code = await getOtpCode(email);
    const { res: verifyRes } = await post("/api/auth/verify", { email, token: code });
    expect(verifyRes.status).toBe(200);
    const cookie = sessionCookie(verifyRes);

    const userId = await getUserIdByEmail(email);
    const { res } = await request(`/api/profile/${userId}`, "DELETE", undefined, cookie);
    expect(res.status).toBe(404);

    // Comportement assumé : le user GoTrue est quand même supprimé (l'ordre
    // deleteUser-avant-delete rend le 404 partiel) → session morte ensuite.
    const { res: after } = await request("/api/profile/settings", "GET", undefined, cookie);
    expect(after.status).toBe(401);
  });

  it("le 403 n'épuise pas le quota de la cible (pas de DoS via l'id d'URL)", async () => {
    // Régression n°2 du fix : le rate limit doit se consommer sur user.id
    // APRÈS le 403 — jamais sur l'id de l'URL. Sinon un attaquant épuise le
    // quota de sa victime (RATE_LIMIT_DELETE = 10/h) et elle ne peut plus
    // jamais supprimer son compte.
    const target = await createTestUser("dostarget");
    const spammer = await createTestUser("dospam");
    const targetId = await getProfileIdViaStory(target);

    // 12 tentatives > quota 10/h : toutes doivent être 403 (jamais 429)
    for (let i = 0; i < 12; i++) {
      const { res } = await request(`/api/profile/${targetId}`, "DELETE", undefined, spammer.cookie);
      expect(res.status).toBe(403);
    }

    // Le quota de la cible est intact : elle peut toujours s'auto-supprimer
    const { res } = await request(`/api/profile/${targetId}`, "DELETE", undefined, target.cookie);
    expect(res.status).toBe(204);
  });
});