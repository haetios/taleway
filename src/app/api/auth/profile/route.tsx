import { db } from "@/db";
import { profiles } from "@/db/schema";
import { parseJsonBody } from "@/lib/parse-json-body";
import { getSupabaseServerClient, unauthorized } from "@/lib/supabase";
import { usernameRule } from "@/validations/rules/username";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const body = await parseJsonBody(request)
    if (body instanceof NextResponse) return body

    // Vérification format
    const result = usernameRule.safeParse((body as { username?: string }).username)

    if (!result.success) {
        return NextResponse.json({
            title: 'Bad request',
            status: 400,
            detail: result.error.issues[0].message
        }, {
            status: 400
        })
    }

    const validUsername = result.data

    // Vérification authentification
    const supabase = await getSupabaseServerClient()
    const { data: { user: currentUser }, error } = await supabase.auth.getUser()

    if(!currentUser || error) {
        return unauthorized()
    }

    // Vérification existence du pseudo
    const [existingUsername] = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.username, validUsername))
        .limit(1)

    if (existingUsername) {
        return NextResponse.json({
            title: 'Conflict',
            status: 409,
            detail: 'This username is already used'
        }, {
            status: 409
        })
    }

    // Ajout du profil
    await db.insert(profiles).values({ id: currentUser.id, username: validUsername })

    return NextResponse.json(null, { status: 201 })
}