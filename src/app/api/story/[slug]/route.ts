import { db } from "@/db";
import { stories, Story, StoryStatus } from "@/db/schema";
import { parseJsonBody } from "@/lib/parse-json-body";
import { storyLimiter, deleteLimiter } from "@/lib/rate-limit";
import { authError, getSupabaseServerClient, internalServerError, unauthorized } from "@/lib/supabase";
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
        return NextResponse.json({
            title: 'Bad request',
            status: 400,
            detail: 'Invalid slug'
        }, {
            status: 400
        })
    }

    const validWithGraph = withGraph === 'true'
    const validSlug = slugResult.data

    // Vérification authentification
    const supabase = await getSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    // Vérification story
    let story: Story | Omit<Story, 'graph'>

    if (validWithGraph) { // Lecture & édition
        if (!user) return unauthorized()
        if (error) {
            if (isAuthApiError(error) && error.status && error.status < 500) {
                return authError(error.status, error.message)
            }

            console.error("[story/[slug]]", error)

            return internalServerError()
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
        return NextResponse.json({
            title: 'Not found',
            status: 404,
            detail: 'Story not found'
        }, {
            status: 404
        })
    }

    return NextResponse.json({
        data: story
    }, {
        status: 200
    })
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
        return NextResponse.json({
            title: 'Bad request',
            status: 400,
            detail: resultEdit.error.issues[0].message
        }, {
            status: 400
        })
    }

    const validBody = resultEdit.data

    const resultSlug = slugRule.safeParse(slug)

    if (!resultSlug.success) {
        return NextResponse.json({
            title: 'Bad request',
            status: 400,
            detail: 'Invalid slug'
        }, {
            status: 400
        })
    }

    const validSlug = resultSlug.data


    // Vérification authentification
    const supabase = await getSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (!user) return unauthorized()
    if (error) {
        if (isAuthApiError(error) && error.status && error.status < 500) {
            return authError(error.status, error.message)
        }

        console.error("[story/[slug]]", error)

        return internalServerError()
    }

    // Rate limit — PUT (écriture)
    try {
        await storyLimiter.consume(user.id)
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

    // Vérification existence d'une histoire ayant le même titre pour l'utilisateur courant
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
            return NextResponse.json({
                title: 'Conflict',
                status: 409,
                detail: 'One of your book has already this title'
            }, {
                status: 409
            })
        }
    }

    // Mise à jour et vérification existence de l'histoire appartenant à l'utilisateur courant
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
        return NextResponse.json({
            title: 'Not found',
            status: 404,
            detail: 'Story not found'
        }, {
            status: 404
        })
    }

    return NextResponse.json({ data: editedStory }, { status: 200 })
}

// request inutilisé mais REQUIS en 1er argument : Next le passe toujours
// en position 0 ; sans lui, { params } déstructurerait le request → 500.
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
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

    // Vérification authentification
    const supabase = await getSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (!user) return unauthorized()
    if (error) {
        if (isAuthApiError(error) && error.status && error.status < 500) {
            return authError(error.status, error.message)
        }

        console.error("[story/[slug]]", error)

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
        return NextResponse.json({
            title: 'Not found',
            status: 404,
            detail: 'Story not found'
        }, {
            status: 404
        })
    }

    return new NextResponse(null, { status: 204 })
}