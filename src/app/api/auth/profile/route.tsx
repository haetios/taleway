import { db } from "@/db";
import { profiles } from "@/db/schema";
import { getSupabaseServerClient } from "@/lib/supabase";
import { usernameRule } from "@/validations/rules/username";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const { username } = await request.json()

    const result = usernameRule.safeParse(username)

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

    const supabase = await getSupabaseServerClient()
    const { data: { user: currentUser }, error } = await supabase.auth.getUser()

    if(!currentUser || error) {
        return NextResponse.json({
            title: 'Unauthorized',
            status: 401,
            detail: 'You have to be authenticated'
        }, {
            status: 401
        })
    }

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

    await db.insert(profiles).values({ id: currentUser.id, username: validUsername })

    return NextResponse.json(null, { status: 201 })
}