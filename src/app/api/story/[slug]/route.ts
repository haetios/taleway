import { db } from "@/db";
import { stories, Story, StoryStatus } from "@/db/schema";
import { parseJsonBody } from "@/lib/parse-json-body";
import { storyEditionLimiter, deletionLimiter, rateLimit } from "@/lib/rate-limit";
import { s200, s204, s400, s401, s404, s409, s500 } from "@/lib/responses";
import { authError, getSupabaseServerClient, getUserFromSupabase } from "@/lib/supabase";
import { slugRule } from "@/validations/rules/slug";
import { editStorySchema } from "@/validations/schemas/edit-story";
import { isAuthApiError } from "@supabase/supabase-js";
import { and, eq, ne, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { withGraph } = Object.fromEntries(request.nextUrl.searchParams)
    const { slug } = await params as { slug: string }

    // Vérification format
    const slugResult = slugRule.safeParse(slug)

    if (!slugResult.success) {
        return s400('Invalid slug')
    }

    const validWithGraph = withGraph === 'true'
    const validSlug = slugResult.data

    // Vérification authentification
    const supabase = await getSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    // Vérification story
    let story: Story | Omit<Story, 'graph'>

    if (validWithGraph) { // Lecture & édition
        if (!user) return s401('You have to be authenticated')
        if (error) {
            if (isAuthApiError(error) && error.status && error.status < 500) {
                return authError(error.status, error.message)
            }

            console.error("[story/[slug]]", error)

            return s500()
        }

        //// Si draft et à l'utilisateur
        //// Si published
        [story] = await db
        .select()
        .from(stories)
        .where(
            and(
                eq(stories.slug, validSlug),
                or(
                    eq(stories.status, StoryStatus.published),
                    and(
                        eq(stories.profileId, user.id),
                        eq(stories.status, StoryStatus.draft)
                    )
                )
            )
        )
    } else {
        // Pas besoin d'être connecté si on ne regarde que les metadata
        [story] = await db
        .select({
            id: stories.id,
            profileId: stories.profileId,
            title: stories.title,
            slug: stories.slug,
            blurb: stories.blurb,
            category: stories.category,
            status: stories.status,
            coverUrl: stories.coverUrl,
            createdAt: stories.createdAt,
            updatedAt: stories.updatedAt,
        })
        .from(stories)
        .where(
            and(
                eq(stories.slug, validSlug),
                eq(stories.status, StoryStatus.published)
            )
        )
    }

    if (!story) {
        return s404('Story not found')
    }

    return s200(story)
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const body = await parseJsonBody(request)
    if (body instanceof NextResponse) return body

    const { slug } = await params

    // Vérification format
    const resultEdit = editStorySchema.safeParse(body)

    if (!resultEdit.success) {
        return s400(resultEdit.error.issues[0].message)
    }

    const validBody = resultEdit.data

    const resultSlug = slugRule.safeParse(slug)

    if (!resultSlug.success) {
        return s400('Invalid slug')
    }

    const validSlug = resultSlug.data


    // Vérification authentification
    const user = await getUserFromSupabase()
    if (user instanceof NextResponse) return user

    // Rate limit
    const rl = await rateLimit(storyEditionLimiter, user.id)
    if (rl instanceof NextResponse) return rl

    // Vérification existence d'un roman (même titre + utilisateur courant)
    if (validBody.title) {
        const [existingTitle] = await db
        .select({ title: stories.title })
        .from(stories)
        .where(
            and(
                eq(stories.title, validBody.title),
                eq(stories.profileId, user.id),
                ne(stories.slug, validSlug)
            )
        ).limit(1)

        if (existingTitle) {
            return s409('One of your book has already this title')
        }
    }

    // Mise à jour du roman (utilisateur courant, si existant)
    const [editedStory] = await db
        .update(stories)
        .set(validBody)
        .where(
            and(
                eq(stories.slug, validSlug),
                eq(stories.profileId, user.id)
            )
        )
        .returning()

    if (!editedStory) {
        return s404('Story not found')
    }

    return s200(editedStory)
}

// request inutilisé mais REQUIS en 1er argument : Next le passe toujours
// en position 0 ; sans lui, { params } déstructurerait le request → 500.
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
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

    // Suppression du roman (si existant)
    const [deletedStory] = await db
        .update(stories)
        .set({ status: StoryStatus.archived })
        .where(
            and(
                eq(stories.slug, validSlug),
                eq(stories.profileId, user.id)
            )
        )
        .returning()

    if (!deletedStory) {
        return s404('Story not found')
    }

    return s204()
}