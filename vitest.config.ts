import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Les tests d'intégration tapent le dev server (next dev) et Supabase local.
    // Exclusion explicite pour ne pas rattraper les .http ou les tests unitaires futurs.
    include: ["tests/integration/**/*.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});