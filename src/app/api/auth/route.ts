import { isAuthApiError } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { authError, getSupabaseServerClient } from "@/lib/supabase";
import { parseJsonBody } from "@/lib/parse-json-body";
import { emailRule } from "@/validations/rules/email";
import { s201, s400, s500 } from "@/lib/responses";

export async function POST(request: NextRequest) {
  const body = await parseJsonBody(request)
  if (body instanceof NextResponse) return body

  // Vérification format
  const result = emailRule.safeParse((body as { email?: string }).email)

  if (!result.success) {
    return s400(result.error.issues[0].message)
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
    if (isAuthApiError(error) && error.status && error.status < 500) {
      return authError(error.status, error.message)
    }

    console.error("[auth]", error)

    return s500()
  }

  return s201()
}