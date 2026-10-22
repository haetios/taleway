import { isAuthApiError } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { parseJsonBody } from "@/lib/parse-json-body";
import { emailRule } from "@/validations/rules/email";

export async function POST(request: NextRequest) {
  const body = await parseJsonBody(request)
  if (body instanceof NextResponse) return body

  // Vérification format
  const result = emailRule.safeParse((body as { email?: string }).email)

  if (!result.success) {
    return NextResponse.json(
      {
        title: "Bad request",
        status: 400,
        detail: result.error.issues[0].message
      },
      { status: 400 }
    )
  }

  const validEmail = result.data

  // Inscription/Connexion
  const supabase = await getSupabaseServerClient()

  const { error } = await supabase.auth.signInWithOtp({
    email: validEmail,
    options: {
      shouldCreateUser: true
    }
  })

  if (error) {
    // Erreur imputable au client (rate limit...) : statut GoTrue relayé (429...)
    if (isAuthApiError(error) && error.status && error.status < 500) {
      return NextResponse.json({
        title: "Auth error",
        status: error.status,
        detail: error.message
      }, {
        status: error.status
      })
    }

    // Vraie erreur serveur : log local, message générique au client
    console.error("[auth]", error)

    return NextResponse.json({
        title: "Internal server error",
        status: 500,
        detail: 'Internal server error'
      }, {
        status: 500
      })
  }

  return NextResponse.json(null, { status: 201 })
}