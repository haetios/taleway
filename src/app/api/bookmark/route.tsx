import { parseJsonBody } from "@/lib/parse-json-body";
import { authError, getSupabaseServerClient, internalServerError, unauthorized } from "@/lib/supabase";
import { isAuthApiError } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const body = await parseJsonBody(request)
    if (body instanceof NextResponse) return body

    const result = { success: false} // To delete

    if (!result.success) {
        return NextResponse.json({
            title: 'Bad request',
            status: 400,
            detail: 'Invalid slug'
        }, {
            status: 400
        })
    }

    // const { nodeId, variables, ... } = result.data

    const supabase = await getSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (!user) return unauthorized()
    if (error) {
        if (isAuthApiError(error) && error.status && error.status < 500) {
            return authError(error.status, error.message)
        }

        console.error("[bookmark]", error)

        return internalServerError()
    }

    // const existing
}