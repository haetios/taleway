/**
 * Client Mailpit — pour récupérer les codes OTP des emails de test.
 * Mailpit expose une API HTTP sur le même port que son UI web (54324 en local).
 */

const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";

/** Vide la boîte Mailpit avant une suite pour partir d'un état propre. */
export async function clearMailpit(): Promise<void> {
  const res = await fetch(`${MAILPIT_URL}/api/v1/messages`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Mailpit clear failed: ${res.status}`);
}

/**
 * Attend et retourne le code à 6 chiffres envoyé à `email`.
 * Poll l'API Mailpit car l'envoi est asynchrone (SMTP local).
 */
export async function getOtpCode(
  email: string,
  { timeoutMs = 10_000 }: { timeoutMs?: number } = {}
): Promise<string> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const res = await fetch(
      `${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(email)}&limit=5`
    );
    if (!res.ok) throw new Error(`Mailpit search failed: ${res.status}`);

    const { messages } = (await res.json()) as {
      messages: { ID: string; Subject: string; To: { Address: string }[] }[];
    };

    // Le plus récent d'abord : messages[0] est le plus ancien, on prend la fin
    const match = [...messages]
      .reverse()
      .find((m) => m.To.some((t) => t.Address === email));

    if (match) {
      // Lit le corps texte du message pour en extraire le code
      const body = await fetch(`${MAILPIT_URL}/api/v1/message/${match.ID}`);
      const message = (await body.json()) as { Text: string };
      const code = message.Text.match(/\b\d{6}\b/)?.[0];
      if (code) return code;
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  throw new Error(`Aucun code OTP reçu par ${email} dans les ${timeoutMs}ms`);
}