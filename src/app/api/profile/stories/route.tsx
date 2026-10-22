import { db } from "@/db";
import { profiles, stories, StoryStatus } from "@/db/schema";
import { authError, getSupabaseServerClient, internalServerError, unauthorized } from "@/lib/supabase";
import { storyWithoutGraph } from "@/types/story-without-graph";
import { isAuthApiError } from "@supabase/supabase-js";
import { and, eq, ne } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_: NextRequest) {
    const supabase = await getSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (!user) return unauthorized()
    if (error) {
        if (isAuthApiError(error) && error.status && error.status < 500) {
            return authError(error.status, error.message)
        }

        console.error("[profile/stories]", error)

        return internalServerError()
    }

    const [profile] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.id, user.id)).limit(1)

    if (!profile) {
        return NextResponse.json({
            title: 'Not found',
            status: 404,
            detail: 'Oops, this page does not exist'
        })
    }

    const storyList = await db
        .select(storyWithoutGraph)
        .from(stories)
        .where(
            and(
                eq(stories.profileId, profile.id),
                ne(stories.status, StoryStatus.archived)
            )
        )

    return NextResponse.json({
        data: storyList
    }, {
        status: 200
    })
}