import { authError, getSupabaseServerClient } from "@/lib/supabase";
import { oauthProviderRule } from "@/validations/rules";
import { isAuthApiError } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

/**
 * Départ OAuth (Discord/Google) : génère l'URL d'autorisation du provider
 * avec le flow PKCE (verifier stocké en cookie par le client SSR), puis
 * redirige le navigateur vers l'écran de consentement du provider.
 *
 * GET /api/auth/oauth/discord → 302 Location: https://discord.com/oauth2/authorize?...
 * GET /api/auth/callback?code=... (retour du provider) échange le code.
 */
export async function GET(_: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params

  // Vérification format
  const result = oauthProviderRule.safeParse(provider)

  if (!result.success) {
    return NextResponse.json(
      {
        title: 'Bad Request',
        status: 400,
        detail: result.error.issues[0].message,
      },
      { status: 400 }
    )
  }

  const supabase = await getSupabaseServerClient()

  // URL d'autorisation + PKCE verifier (cookie). skipBrowserRedirect :
  // le server client n'a pas de window — on redirige nous-mêmes.
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: result.data,
    options: {
      redirectTo: `${process.env.SITE_URL ?? "http://localhost:3000"}/api/auth/callback`,
      skipBrowserRedirect: true,
    },
  })

  if (error) {
    if (isAuthApiError(error) && error.status && error.status < 500) {
      return authError(error.status, error.message)
    }

    console.error("[auth/oauth]", error)

    return NextResponse.json(
      {
        title: 'Internal Server Error',
        status: 500,
        detail: 'Internal Server Error',
      },
      { status: 500 }
    )
  }

  // Les cookies posés via cookies().set pendant l'appel (verifier PKCE)
  // sont automatiquement joints à cette réponse sortante par Next.
  return NextResponse.redirect(data.url)
}