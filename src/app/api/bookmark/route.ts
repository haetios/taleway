import { db } from "@/db";
import { bookmarks, stories, StoryStatus } from "@/db/schema";
import { parseJsonBody } from "@/lib/parse-json-body";
import { bookmarkLimiter } from "@/lib/rate-limit";
import { authError, getSupabaseServerClient, internalServerError, unauthorized } from "@/lib/supabase";
import { bookmarkSchema } from "@/validations/schemas/bookmark";
import { isAuthApiError } from "@supabase/supabase-js";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const body = await parseJsonBody(request)
    if (body instanceof NextResponse) return body

    const result = bookmarkSchema.safeParse(body)

    if (!result.success) {
        return NextResponse.json({
            title: 'Bad request',
            status: 400,
            detail: result.error.issues[0].message
        }, {
            status: 400
        })
    }

    const { slug, nodeId, variables } = result.data

    const supabase = await getSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (!user) return unauthorized()
    if (error) {
        if (isAuthApiError(error) && error.status && error.status < 500) {
            return authError(error.status, error.message)
        }

        console.error("[bookmark]", error)

        return internalServerError()
    }

    // Rate limit
    try {
        await bookmarkLimiter.consume(user.id)
    } catch {
        return NextResponse.json({
            title: 'Too Many Requests',
            status: 429,
            detail: 'Rate limit exceeded, try again later'
        }, {
            status: 429,
            headers: { 'Retry-After': '60' }
        })
    }

    const [existingStory] = await db
        .select({ id: stories.id })
        .from(stories)
        .where(
            and(
                eq(stories.slug, slug),
                eq(stories.status, StoryStatus.published),
            )
        )

    if (!existingStory) {
        return NextResponse.json({
            title: 'Not found',
            status: 404,
            detail: 'Story not found'
        }, {
            status: 404
        })
    }

    await db.insert(bookmarks)
    .values({ storyId: existingStory.id, profileId: user.id, nodeId, variables })
    .onConflictDoUpdate({
        target: [bookmarks.profileId, bookmarks.storyId],
        set: { nodeId, variables },
    })

    return NextResponse.json({
        title: 'OK',
        status: 200,
        detail: 'Bookmark updated'
    }, {
        status: 200
    })
}