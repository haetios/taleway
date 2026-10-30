import { getSupabaseServerClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

/**
 * Retour OAuth (Discord/Google) : le provider redirige ici avec un code
 * d'autorisation. On l'échange contre une session (le verifier PKCE,
 * stocké en cookie au départ par /api/auth/oauth/[provider], est relu
 * automatiquement par le client SSR), puis on renvoie l'utilisateur
 * vers la suite du flux (choix du pseudo si profil absent).
 *
 * Erreurs : redirection vers /auth?error=... (le navigateur ne sait pas
 * lire un problem+json sur une 302).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const oauthError = searchParams.get("error")

  // Le provider peut renvoyer une erreur explicite (refus de consentement...)
  if (oauthError) {
    return NextResponse.redirect(
      new URL(`/auth?error=${encodeURIComponent(oauthError)}`, request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(new URL("/auth?error=missing_code", request.url))
  }

  const supabase = await getSupabaseServerClient()

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    // Code expiré/consommé ou verifier PKCE absent : pas de distinction
    // utile côté navigateur — redirection d'échec générique.
    console.error("[auth/callback]", error)
    return NextResponse.redirect(new URL("/auth?error=exchange_failed", request.url))
  }

  // Session posée (cookie sb-... joint automatiquement). Prochaine étape
  // du flux : le front vérifie GET /profile/settings — 404 = profil à créer.
  return NextResponse.redirect(new URL("/auth", request.url))
}