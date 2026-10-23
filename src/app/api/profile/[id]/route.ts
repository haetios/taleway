import { db } from "@/db";
import { profiles } from "@/db/schema";
import { s200, s204, s400, s401, s404, s500 } from "@/lib/responses";
import { getSupabaseAdminClient, getUserFromSupabase } from "@/lib/supabase";
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

export async function DELETE(_: NextRequest) {

    // Vérification authentification
    const user = await getUserFromSupabase()
    if (user instanceof NextResponse) return user

    const [profile] = await db.delete(profiles).where(eq(profiles.id, user.id)).returning()

    if (!profile) {
        return s404('Profile not found')
    }

    const supabase = await getSupabaseAdminClient()
    await supabase.auth.signOut()
    const { data: { user: deletedUser }, error} = await supabase.auth.admin.deleteUser(profile.id)

    if (!deletedUser) return s401()
    if (error) {
        if (isAuthApiError(error) && error.status && error.status < 500) {
            return s401()
        }

        console.log("[profile/[id]]", error)

        return s500()
    }

    return s204()
}