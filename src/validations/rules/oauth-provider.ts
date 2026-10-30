import z from "zod";

/** Providers OAuth supportés par Taleway. */
export const oauthProviderRule = z.enum(["discord", "google"], {
  error: "Unsupported OAuth provider",
});