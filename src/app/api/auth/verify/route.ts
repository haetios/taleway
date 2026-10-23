import { isAuthApiError } from "@supabase/supabase-js";
import { parseJsonBody } from "@/lib/parse-json-body";
import { authError, getSupabaseServerClient } from "@/lib/supabase";
import { verifyOtpSchema } from "@/validations/schemas/verify-otp";
import { NextRequest, NextResponse } from "next/server";
import { s200, s400, s500 } from "@/lib/responses";

export async function POST(request: NextRequest) {
    const body = await parseJsonBody(request)
    if (body instanceof NextResponse) return body

    // Vérification format
    const result = verifyOtpSchema.safeParse(body)

    if (!result.success) {
        return s400(result.error.issues[0].message)
    }

    // Vérification token
    const supabase = await getSupabaseServerClient()

    const { error } = await supabase.auth.verifyOtp({
        email: result.data.email,
        token: result.data.token,
        type: "email"
    })

    if (error) {
        if (isAuthApiError(error) && error.status && error.status < 500) {
            return authError(error.status, error.message)
        }

        console.error("[auth/verify]", error)

        return s500()
    }

    return s200()
}