import { parseJsonBody } from "@/lib/parse-json-body";
import { getSupabaseServerClient, unauthorized } from "@/lib/supabase";
import { verifyOtpSchema } from "@/validations/schemas/verify-otp";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const body = await parseJsonBody(request)
    if (body instanceof NextResponse) return body

    // Vérification format
    const result = verifyOtpSchema.safeParse(body)

    if (!result.success) {
        return NextResponse.json({
            title: 'Bad request',
            status: 400,
            detail: result.error.issues[0].message
        }, {
            status: 400
        })
    }

    // Vérification token
    const supabase = await getSupabaseServerClient()

    const { error } = await supabase.auth.verifyOtp({
        email: result.data.email,
        token: result.data.token,
        type: "email"
    })

    if (error) {
        return unauthorized(error.message)
    }

    return NextResponse.json(null, { status: 200 })
}