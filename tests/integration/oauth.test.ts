/**
 * Tests d'intégration : GET /api/auth/oauth/[provider] et GET /api/auth/callback.
 *
 * Sans clés OAuth configurées en local, GoTrue renvoie une erreur "provider
 * is not enabled" (400/401/403) que les handlers relais — on teste donc :
 * - la validation du provider (400),
 * - le relay de l'erreur GoTrue (pas de 500 nu),
 * - le callback : sans code → redirection d'erreur, code invalide → redirection d'erreur.
 * Le circuit complet (302 → provider → callback → session) exige de vraies
 * clés Discord/Google : non testable en CI, couvert manuellement avec les clés.
 */

import { describe, expect, it } from "vitest";

const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000";

/** GET sans helper request() (méthodes limitées à GET/PUT/DELETE là-bas). */
async function get(path: string, cookie?: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { ...(cookie ? { Cookie: cookie } : {}) },
    redirect: "manual", // ne PAS suivre les 302 : on les inspecte
  });
  return { res, json: await res.json().catch(() => null) };
}

describe("GET /api/auth/oauth/[provider]", () => {
  it("400 — provider non supporté", async () => {
    const { res, json } = await get("/api/auth/oauth/github");
    expect(res.status).toBe(400);
    expect(json.detail).toBe("Unsupported OAuth provider");
  });

  it("307 — URL d'autorisation + verifier PKCE posé en cookie (discord)", async () => {
    // GoTrue génère l'URL authorize sans valider les clés (validées à
    // l'échange) : on doit obtenir une redirection vers /auth/v1/authorize
    // avec code_challenge PKCE, et le verifier en cookie.
    const { res } = await get("/api/auth/oauth/discord");
    expect(res.status).toBe(307);

    const location = res.headers.get("location") ?? "";
    expect(location).toContain("/auth/v1/authorize");
    expect(location).toContain("provider=discord");
    expect(location).toContain("code_challenge=");
    expect(location).toContain("code_challenge_method=s256");
    expect(location).toContain(
      encodeURIComponent("/api/auth/callback")
    );

    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("code-verifier");
  });

  it("307 — idem google (provider alternatif accepté)", async () => {
    const { res } = await get("/api/auth/oauth/google");
    expect(res.status).toBe(307);

    const location = res.headers.get("location") ?? "";
    expect(location).toContain("provider=google");
    expect(location).toContain("code_challenge=");
  });
});

describe("GET /api/auth/callback", () => {
  it("redirige vers /auth?error=... — pas de code", async () => {
    const { res } = await get("/api/auth/callback");
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/auth?error=missing_code");
  });

  it("redirige vers /auth?error=... — code invalide (verifier PKCE absent)", async () => {
    const { res } = await get("/api/auth/callback?code=totalement-invalide");
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/auth?error=exchange_failed");
  });

  it("redirige vers /auth?error=... — refus explicite du provider (error param)", async () => {
    const { res } = await get("/api/auth/callback?error=access_denied");
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain(
      encodeURIComponent("access_denied")
    );
  });
});