import { db } from "@/db";
import { profiles } from "@/db/schema";
import { deletionLimiter, rateLimit } from "@/lib/rate-limit";
import { s200, s204, s400, s403, s404, s500 } from "@/lib/responses";
import { authError, getSupabaseAdminClient, getUserFromSupabase } from "@/lib/supabase";
import { profileIdRule } from "@/validations/rules";
import { isAuthApiError } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    // Vérification format
    const result = profileIdRule.safeParse(id)

    if (!result.success) {
        return s400('Invalid profile id')
    }

    const validId = result.data

    // Vérification existence du profil
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, validId))

    if (!profile) {
        return s404('Profile not found')
    }

    return s200(profile)
}

export async function DELETE(_: NextRequest, { params } : { params: Promise<{ id: string }> }) {
    const { id } = await params

    const result = profileIdRule.safeParse(id)

    if (!result.success) {
        return s400('Invalid ID')
    }

    const validId = result.data

    // Vérification authentification
    const user = await getUserFromSupabase()
    if (user instanceof NextResponse) return user

    if (user.id != validId) {
        return s403()
    }

    const rl = await rateLimit(deletionLimiter, user.id)
    if (rl instanceof NextResponse) return rl

    const supabase = getSupabaseAdminClient()
    await supabase.auth.signOut()
    const { error } = await supabase.auth.admin.deleteUser(validId)

    if (error) {
        if (isAuthApiError(error) && error.status && error.status < 500) {
            return authError(error.status, error.message)
        }

        console.error("[profile/[id]]", error)

        return s500()
    }

    const [profile] = await db.delete(profiles).where(eq(profiles.id, user.id)).returning()

    if (!profile) {
        return s404('Profile not found')
    }

    return s204()
}