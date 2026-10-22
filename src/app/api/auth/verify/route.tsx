import { isAuthApiError } from "@supabase/supabase-js";
import { parseJsonBody } from "@/lib/parse-json-body";
import { getSupabaseServerClient } from "@/lib/supabase";
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
        // Erreur imputable au client (code faux/expiré 403, rate limit 429...) :
        // statut GoTrue relayé tel quel
        if (isAuthApiError(error) && error.status && error.status < 500) {
            return NextResponse.json({
                title: 'Auth error',
                status: error.status,
                detail: error.message
            }, {
                status: error.status
            })
        }

        // Vraie erreur serveur : log local, message générique au client
        console.error("[auth/verify]", error)

        return NextResponse.json({
            title: 'Internal server error',
            status: 500,
            detail: 'Internal server error'
        }, {
            status: 500
        })
    }

    return NextResponse.json(null, { status: 200 })
}