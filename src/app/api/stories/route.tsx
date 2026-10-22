import { db } from "@/db";
import { stories, StoryStatus } from "@/db/schema";
import { parseJsonBody } from "@/lib/parse-json-body";
import { buildSlug } from "@/lib/slug";
import { getSupabaseServerClient, unauthorized } from "@/lib/supabase";
import { titleRule } from "@/validations/rules/title";
import { queryParamSchema } from "@/validations/schemas/query-params";
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
            detail: 'The title is compulsory'
        }, {
            status: 400
        })
    }

    // Vérification authentification
    const supabase = await getSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        return unauthorized()
    }

    // Vérification existence du titre
    const validTitle = result.data

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

    const result = queryParamSchema.safeParse(queryParams)

    if (!result.success) {
        return NextResponse.json({
            title: 'Bad request',
            status: 400,
            detail: 'Incorrect query params'
        }, {
            status: 400
        })
    }

    const validQueryParams = result.data

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

    const storyList = await db.select({
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
    .where(and(eq(stories.status, StoryStatus.published), ...conditions))

    if (storyList.length === 0) {
        return NextResponse.json({
            data: []
        }, {
            status: 200
        })
    }

    return NextResponse.json({
        data: storyList
    }, {
        status: 200
    })
}