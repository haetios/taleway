import { db } from "@/db";
import { profiles } from "@/db/schema";
import { parseJsonBody } from "@/lib/parse-json-body";
import { s201, s400, s409 } from "@/lib/responses";
import { getUserFromSupabase } from "@/lib/supabase";
import { usernameRule } from "@/validations/rules/username";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const body = await parseJsonBody(request)
    if (body instanceof NextResponse) return body

    // Vérification format
    const result = usernameRule.safeParse((body as { username?: string }).username)

    if (!result.success) {
        return s400('Invalid username')
    }

    const validUsername = result.data

    // Vérification authentification
    const user = await getUserFromSupabase()
    if (user instanceof NextResponse) return user

    // Vérification existence du pseudo
    const [existingUsername] = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.username, validUsername))
        .limit(1)

    if (existingUsername) {
        return s409('Username already used')
    }

    // Ajout du profil
    const [profile] = await db.insert(profiles).values({ id: user.id, username: validUsername }).returning()

    return s201(profile.id)
}