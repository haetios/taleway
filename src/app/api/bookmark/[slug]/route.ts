import { db } from "@/db";
import { bookmarks, stories, StoryStatus } from "@/db/schema";
import { deletionLimiter, rateLimit } from "@/lib/rate-limit";
import { s200, s204, s400, s404 } from "@/lib/responses";
import { getUserFromSupabase } from "@/lib/supabase";
import { slugRule } from "@/validations/rules";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params

    // Vérification format
    const result = slugRule.safeParse(slug)

    if (!result.success) {
        return s400('Invalid slug')
    }

    const validSlug = result.data

    // Vérification authentification
    const user = await getUserFromSupabase()
    if (user instanceof NextResponse) return user

    // Vérification existence du roman
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
        return s404('Story not found')
    }

    // Vérification existence du marque-page
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
        return s404('Bookmark not found')
    }

    return s200(existingBookmark)
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params

    // Vérification format
    const result = slugRule.safeParse(slug)

    if (!result.success) {
        return s400('Invalid slug')
    }

    const validSlug = result.data

    // Vérification authentification
    const user = await getUserFromSupabase()
    if (user instanceof NextResponse) return user

    // Rate limit
    const rl = await rateLimit(deletionLimiter, user.id)
    if (rl instanceof NextResponse) return rl

    // Vérification existence du roman
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
        return s404('Story not found')
    }

    // Suppression du marque-page
    const [deletedBookmark] = await db
        .delete(bookmarks)
        .where(
            and(
                eq(bookmarks.storyId, existingStory.id),
                eq(bookmarks.profileId, user.id)
            )
        ).returning()

    if (!deletedBookmark) {
        return s404('Bookmark not found')
    }

    return s204()
}