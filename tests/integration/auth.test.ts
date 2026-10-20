import { describe, expect, it, beforeAll } from "vitest";
import { clearMailpit, getOtpCode } from "../helpers/mailpit";

const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000";

/** Requête POST JSON utilitaire. */
async function post(path: string, body: unknown, cookie?: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(body),
  });
  return { res, json: await res.json().catch(() => null) };
}

/** Extrait le cookie de session Supabase des headers d'une réponse. */
function sessionCookie(res: Response): string {
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) throw new Error("Pas de set-cookie dans la réponse");
  return setCookie;
}

describe("POST /api/auth", () => {
  it("400 — email manquant", async () => {
    const { res } = await post("/api/auth", { email: "" });
    expect(res.status).toBe(400);
  });

  it("400 — email malformé", async () => {
    const { res } = await post("/api/auth", { email: "toto@outlook" });
    expect(res.status).toBe(400);
  });

  it("201 — envoie un code OTP", async () => {
    const { res } = await post("/api/auth", { email: "vitest@taleway.dev" });
    expect(res.status).toBe(201);
    // Le code doit être arrivé dans Mailpit
    const code = await getOtpCode("vitest@taleway.dev");
    expect(code).toMatch(/^\d{6}$/);
  });
});

describe("POST /api/auth/verify", () => {
  it("400 — payload invalide", async () => {
    const { res } = await post("/api/auth/verify", { email: "", token: "012345" });
    expect(res.status).toBe(400);
  });

  it("401 — code erroné", async () => {
    const { res } = await post("/api/auth/verify", {
      email: "vitest@taleway.dev",
      token: "000000",
    });
    expect(res.status).toBe(401);
  });

  it("200 — code correct, pose la session", async () => {
    await post("/api/auth", { email: "vitest@taleway.dev" });
    const code = await getOtpCode("vitest@taleway.dev");

    const { res } = await post("/api/auth/verify", {
      email: "vitest@taleway.dev",
      token: code,
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toContain("sb-");
  });
});

describe("POST /api/auth/profile", () => {
  beforeAll(async () => {
    await clearMailpit();
  });

  it("circuit complet — session, profil, conflit", async () => {
    // Identifiants uniques par run : la suite doit être rejouable sans db:reset
    // (les runs précédents laissent leurs données dans la vraie base)
    const runId = Date.now();
    const username = `Vitest_${runId}`;
    const email = `profile-test-${runId}@taleway.dev`;
    const imposteurEmail = `imposteur-${runId}@taleway.dev`;

    // 1. Inscription/connexion et vérification
    await post("/api/auth", { email });
    const code = await getOtpCode(email);
    const { res: verifyRes } = await post("/api/auth/verify", {
      email,
      token: code,
    });
    expect(verifyRes.status).toBe(200);

    const cookie = sessionCookie(verifyRes);

    // 2. Sans session → 401, MÊME si l'username est déjà pris
    //    (le check auth précède le check de conflit)
    const { res: noAuth } = await post("/api/auth/profile", {
      username,
    });
    expect(noAuth.status).toBe(401);

    // 3. Avec session → 201, profil créé
    const { res: created } = await post(
      "/api/auth/profile",
      { username },
      cookie
    );
    expect(created.status).toBe(201);

    // 4. Username déjà pris → 409
    await post("/api/auth", { email: imposteurEmail });
    const code2 = await getOtpCode(imposteurEmail);
    const { res: verify2 } = await post("/api/auth/verify", {
      email: imposteurEmail,
      token: code2,
    });
    const cookie2 = sessionCookie(verify2);

    const { res: conflict } = await post(
      "/api/auth/profile",
      { username },
      cookie2
    );
    expect(conflict.status).toBe(409);

    // 5. Sans session, username créé à l'étape 3 → toujours 401, jamais 409
    //    (reproduit la question 401 vs 409 : l'auth gagne sur le conflit)
    const { res: noAuthEvenTaken } = await post("/api/auth/profile", {
      username,
    });
    expect(noAuthEvenTaken.status).toBe(401);
  });
});