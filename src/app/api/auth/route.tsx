import { emailRule } from "@/validations/rules/email";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const { email } = await request.json()

  const result = emailRule.safeParse(email)

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

  const supabase = await getSupabaseServerClient()

  const { error } = await supabase.auth.signInWithOtp({
    email: validEmail,
    options: {
      shouldCreateUser: true
    }
  })

  if (error) {
    return NextResponse.json({
        title: "Internal server error",
        status: 500,
        detail: error.message
      }, {
        status: 500
      })
  }

  return NextResponse.json(null, { status: 201 })
}