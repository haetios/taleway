import { createServerClient } from "@supabase/ssr"
import { isAuthApiError } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { s401, s500 } from "./responses"

export async function getSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // appelé depuis un contexte où on ne peut pas écrire de cookies
          }
        },
      },
    }
  )
}

export async function getUserFromSupabase() {
  const supabase = await getSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (!user) return s401('You have to be authenticated')
  if (error) {
      if (isAuthApiError(error) && error.status && error.status < 500) {
          return authError(error.status, error.message)
      }

      console.error("[story/[slug]]", error)

      return s500()
  }

  return user
}

export function authError(status: number, message?: string) {
  return NextResponse.json({
      title: 'Auth error',
      status: status,
      detail: message
  }, {
      status: status
  })
}