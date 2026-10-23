import { db } from "@/db";
import { profiles } from "@/db/schema";
import { parseJsonBody } from "@/lib/parse-json-body";
import { getSupabaseServerClient, getUserFromSupabase } from "@/lib/supabase";
import { settingsLimiter } from "@/lib/rate-limit";
import { settingsSchema } from "@/validations/schemas/settings";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { s200, s204, s400, s404, s409 } from "@/lib/responses";

export async function GET(_: NextRequest) {

    // Vérification authentification
    const user = await getUserFromSupabase()
    if (user instanceof NextResponse) return user

    // Vérification profil
    const [existingProfile] = await db.select().from(profiles).where(eq(profiles.id, user.id))

    if (!existingProfile) {
        return s404()
    }

    return s200({
        email: user.email,
        username: existingProfile.username,
        bio: existingProfile.bio,
    })
}

export async function PUT(request: NextRequest) {
    const body = await parseJsonBody(request)
    if (body instanceof NextResponse) return body

    // Vérification format
    const result = settingsSchema.safeParse(body)

    if (!result.success) {
        return s400(result.error.issues[0].message)
    }

    const { email, username, bio } = result.data

    // Vérification authentification
    const user = await getUserFromSupabase()
    if (user instanceof NextResponse) return user

    // Rate limit
    try {
        await settingsLimiter.consume(user.id)
    } catch (rejRes) {
        const seconds = Math.ceil((rejRes as { msBeforeNext: number }).msBeforeNext / 1000)
        return NextResponse.json({
            title: 'Too Many Requests',
            status: 429,
            detail: 'Rate limit exceeded, try again later'
        }, {
            status: 429,
            headers: { 'Retry-After': String(seconds) }
        })
    }

    // Vérification profil
    const [existingProfile] = await db.select().from(profiles).where(eq(profiles.id, user.id))

    if (!existingProfile) {
        return s404('Profile not found')
    }

    // Mise à jour de l'email
    const supabase = await getSupabaseServerClient()
    await supabase.auth.updateUser({ email })
    // ! checker error

    // Vérification existence du pseudo
    if (username) {
        const [existingUsername] = await db
            .select({ id: profiles.id })
            .from(profiles)
            .where(eq(profiles.username, username))

        if (existingUsername) {
            return s409('Username already used')
        }
    }

    // Mise à jour du profil
    await db.update(profiles).set({ username, bio }).where(eq(profiles.id, user.id))

    return s204()
}