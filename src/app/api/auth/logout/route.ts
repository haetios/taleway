import { logoutLimiter, rateLimit } from "@/lib/rate-limit";
import { s200, s500 } from "@/lib/responses";
import { authError, getSupabaseServerClient, getUserFromSupabase } from "@/lib/supabase";
import { isAuthApiError } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(_: NextRequest) {
    const user = await getUserFromSupabase()
    if (user instanceof NextResponse) return user

    const rl = await rateLimit(logoutLimiter, user.id)
    if (rl instanceof NextResponse) return rl

    const supabase = await getSupabaseServerClient()
    const { error } = await supabase.auth.signOut({ scope: 'local' })

    if (error) {
        if (isAuthApiError(error) && error.status && error.status < 500) {
            return authError(error.status, error.message)
        }

        console.error("[auth/logout]", error)

        return s500()
    }

    return s200()
}