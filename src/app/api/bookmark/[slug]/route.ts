import { db } from "@/db";
import { bookmarks, stories, StoryStatus } from "@/db/schema";
import { deleteLimiter } from "@/lib/rate-limit";
import { getSupabaseServerClient, authError, internalServerError, unauthorized } from "@/lib/supabase";
import { slugRule } from "@/validations/rules";
import { isAuthApiError } from "@supabase/supabase-js";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params

    const result = slugRule.safeParse(slug)

    if (!result.success) {
        return NextResponse.json({
            title: 'Bad request',
            status: 400,
            detail: 'Invalid slug'
        }, {
            status: 400
        })
    }

    const validSlug = result.data

    const supabase = await getSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (!user) return unauthorized()
    if (error) {
        if (isAuthApiError(error) && error.status && error.status < 500) {
            return authError(error.status, error.message)
        }

        console.error("[bookmark/[slug]]", error)

        return internalServerError()
    }

    const [existingStory] = await db
        .select({ id: stories.id })
        .from(stories)
        .where(
            and(
                eq(stories.slug, validSlug),
                eq(stories.status, StoryStatus.published)
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

    const [existingBookmark] = await db
        .select()
        .from(bookmarks)
        .where(
            and(
                eq(bookmarks.profileId, user.id),
                eq(bookmarks.storyId, existingStory.id)
            )
        )

    if (!existingBookmark) {
        return NextResponse.json({
            title: 'Not found',
            status: 404,
            detail: 'Bookmark not found'
        }, {
            status: 404
        })
    }

    return NextResponse.json({
        data: existingBookmark
    }, {
        status: 200
    })
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params

    const result = slugRule.safeParse(slug)

    if (!result.success) {
        return NextResponse.json({
            title: 'Bad request',
            status: 400,
            detail: 'Invalid slug'
        }, {
            status: 400
        })
    }

    const validSlug = result.data

    const supabase = await getSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (!user) return unauthorized()
    if (error) {
        if (isAuthApiError(error) && error.status && error.status < 500) {
            return authError(error.status, error.message)
        }

        console.error("[bookmark/[slug]]", error)

        return internalServerError()
    }

    // Rate limit — DELETE (suppression)
    try {
        await deleteLimiter.consume(user.id)
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

    const [existingStory] = await db
        .select({ id: stories.id })
        .from(stories)
        .where(
            and(
                eq(stories.slug, validSlug),
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

    const [deletedBookmark] = await db
        .delete(bookmarks)
        .where(
            and(
                eq(bookmarks.storyId, existingStory.id),
                eq(bookmarks.profileId, user.id)
            )
        ).returning()

    if (!deletedBookmark) {
        return NextResponse.json({
            title: 'Not found',
            status: 404,
            detail: 'Bookmark not found'
        }, {
            status: 404
        })
    }

    return new NextResponse(null, { status: 204 })
}