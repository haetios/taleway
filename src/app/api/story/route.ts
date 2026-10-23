import { db } from "@/db";
import { stories, StoryStatus } from "@/db/schema";
import { parseJsonBody } from "@/lib/parse-json-body";
import { storyCreationLimiter } from "@/lib/rate-limit";
import { buildSlug } from "@/lib/slug";
import { authError, getSupabaseServerClient, getUserFromSupabase, internalServerError, unauthorized } from "@/lib/supabase";
import { storyWithoutGraph } from "@/types/story-without-graph";
import { titleRule } from "@/validations/rules/title";
import { queryParamSchema } from "@/validations/schemas/query-params";
import { isAuthApiError } from "@supabase/supabase-js";
import { and, eq, inArray, like, ne, SQL } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {

    const body = await parseJsonBody(request)
    if (body instanceof NextResponse) return body

    // Vérification format
    const result = titleRule.safeParse((body as { title?: string }).title)

    if (!result.success) {
        return NextResponse.json({
            title: 'Bad request',
            status: 400,
            detail: 'Invalid title'
        }, {
            status: 400
        })
    }

    const validTitle = result.data

    // Vérification authentification
    const user = await getUserFromSupabase()
    if (user instanceof NextResponse) return user

    // Rate limit
    try {
        await storyCreationLimiter.consume(user.id)
    } catch {
        return NextResponse.json({
            title: 'Too Many Requests',
            status: 429,
            detail: 'Rate limit exceeded, try again later'
        }, {
            status: 429,
            headers: { 'Retry-After': '3600' }
        })
    }

    // Vérification existence du titre
    const [existingTitle] = await db
        .select({ id: stories.id })
        .from(stories)
        .where(and(
            eq(stories.title, validTitle),
            eq(stories.profileId, user.id),
            ne(stories.status, StoryStatus.archived)
        ))
        .limit(1)

    if (existingTitle) {
        return NextResponse.json({
            title: 'Conflict',
            status: 409,
            detail: 'One of your books has already this title'
        }, {
            status: 409
        })
    }

    // Ajout du roman
    const [createdStory] = await db.insert(stories).values({
        profileId: user.id,
        title: validTitle,
        slug: buildSlug(validTitle),
        graph: {}
    }).returning({ slug: stories.slug })

    return NextResponse.json({ data: createdStory }, { status: 201 })
}

export async function GET(request: NextRequest) {
    const queryParams = request.nextUrl.searchParams

    // Vérification format
    const result = queryParamSchema.safeParse(Object.fromEntries(queryParams))

    if (!result.success) {
        return NextResponse.json({
            title: 'Bad request',
            status: 400,
            detail: result.error.issues[0].message
        }, {
            status: 400
        })
    }

    const validQueryParams = result.data

    // Préparation des filtres
    const conditions: SQL[] = []

    if (validQueryParams.title) {
        conditions.push(like(stories.title, '%' + validQueryParams.title + '%'))
    }

    if (validQueryParams.categories) {
        conditions.push(inArray(stories.category, validQueryParams.categories))
    }

    if (validQueryParams.authors) {
        conditions.push(inArray(stories.profileId, validQueryParams.authors))
    }

    // Récupération des romans
    const storyList = await db
        .select(storyWithoutGraph)
        .from(stories)
        .where(
            and(
                eq(stories.status, StoryStatus.published),
                ...conditions
            )
        )

    return NextResponse.json({
        data: storyList
    }, {
        status: 200
    })
}