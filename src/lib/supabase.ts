import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

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

export function unauthorized(message?: string) {
  return NextResponse.json({
      title: 'Unauthorized',
      status: 401,
      detail: message ? message : 'You have to be authenticated'
  }, {
      status: 401
  })
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

export function internalServerError(message?: string) {
  return NextResponse.json({
      title: 'Internal Server Error',
      status: 500,
      detail: message ? message : 'Internal Server Error'
  }, {
      status: 500
  })
}