import { db } from "@/db";
import { profiles } from "@/db/schema";
import { getSupabaseServerClient } from "@/lib/supabase";
import { verifyOtpSchema } from "@/validations/schemas/verify-otp";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const { email, token } = await request.json()

    const result = verifyOtpSchema.safeParse({ email, token })

    if (!result.success) {
        return NextResponse.json({
            title: 'Bad request',
            status: 400,
            detail: result.error.issues[0].message
        }, {
            status: 400
        })
    }

    const supabase = await getSupabaseServerClient()

    const { error } = await supabase.auth.verifyOtp({
        email: result.data.email,
        token: result.data.token,
        type: "email"
    })

    if (error) {
        return NextResponse.json({
            title: error.name,
            status: 401,
            detail: error.message
        }, {
            status: 401
        })
    }

    return NextResponse.json(null, { status: 200 })
}