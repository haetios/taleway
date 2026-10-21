/** Utils HTTP étendus : GET/PUT/DELETE en plus du POST de helpers/auth. */

const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000";

/** Requête générique : remplace post() quand la méthode n'est pas POST. */
export async function request(
  path: string,
  method: "GET" | "PUT" | "DELETE",
  body?: unknown,
  cookie?: string
) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return { res, json: await res.json().catch(() => null) };
}