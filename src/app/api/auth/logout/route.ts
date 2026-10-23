import { authError, getSupabaseServerClient, internalServerError } from "@/lib/supabase";
import { isAuthApiError } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

export async function POST(_: NextRequest) {
    const supabase = await getSupabaseServerClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
        if (isAuthApiError(error) && error.status && error.status < 500) {
            return authError(error.status, error.message)
        }

        console.log("[auth/logout]", error)

        return internalServerError()
    }
}