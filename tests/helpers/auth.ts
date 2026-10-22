/**
 * Fixture d'auth pour les tests d'intégration : chaque suite crée SON
 * utilisateur (email/username uniques par run), indépendant des autres.
 * Les fichiers de test restent isolés : jouables seuls ou tous ensemble.
 */

import { getOtpCode } from "./mailpit";

const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000";

/** Requête POST JSON utilitaire. */
export async function post(path: string, body: unknown, cookie?: string) {
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
export function sessionCookie(res: Response): string {
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) throw new Error("Pas de set-cookie dans la réponse");
  return setCookie;
}

export interface TestUser {
  email: string;
  username: string;
  cookie: string;
}

/**
 * Crée un utilisateur complet : OTP → verify → profile.
 * Identifiants uniques par appel (Date.now) → rejouable sans db:reset.
 */
export async function createTestUser(prefix = "test"): Promise<TestUser> {
  const runId = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const email = `${prefix}-${runId}@taleway.dev`;
  const username = `${prefix}_${runId}`;

  // Pas de clearMailpit() ici : il effacerait les OTP en vol des autres
  // fichiers de test tournant en parallèle (emails uniques → inutile de vider).

  await post("/api/auth", { email });
  const code = await getOtpCode(email);
  const { res: verifyRes } = await post("/api/auth/verify", { email, token: code });
  if (verifyRes.status !== 200) {
    throw new Error(`verify échoué (${verifyRes.status}) pour ${email}`);
  }
  const cookie = sessionCookie(verifyRes);

  const { res: profileRes } = await post("/api/auth/profile", { username }, cookie);
  if (profileRes.status !== 201) {
    throw new Error(`profile échoué (${profileRes.status}) pour ${email}`);
  }

  return { email, username, cookie };
}