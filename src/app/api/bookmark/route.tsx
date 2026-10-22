import { parseJsonBody } from "@/lib/parse-json-body";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const body = await parseJsonBody(request)
    if (body instanceof NextResponse) return body

    // const result = slugRule.safeParse((body as { slug?: string }).slug)

    // if (!result.success) {
    //     return NextResponse.json({
    //         title: 'Bad request',
    //         status: 400,
    //         detail: 'Invalid slug'
    //     }, {
    //         status: 400
    //     })
    // }

    // const validSlug = result.data

    // const supabase = await getSupabaseServerClient()
    // const { data: { user }, error } = await supabase.auth.getUser()

    // if (!user) return unauthorized()
    // if (error) {
    //     if (isAuthApiError(error) && error.status && error.status < 500) {
    //         return authError(error.status, error.message)
    //     }

    //     console.error("[bookmark]", error)

    //     return internalServerError()
    // }

    // const existing
}