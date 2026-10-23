import { db } from "@/db";
import { stories, StoryStatus } from "@/db/schema";
import { parseJsonBody } from "@/lib/parse-json-body";
import { rateLimit, storyCreationLimiter } from "@/lib/rate-limit";
import { s200, s201, s400, s409 } from "@/lib/responses";
import { buildSlug } from "@/lib/slug";
import { getUserFromSupabase } from "@/lib/supabase";
import { storyWithoutGraph } from "@/types/story-without-graph";
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
        return s400('Invalid title')
    }

    const validTitle = result.data

    // Vérification authentification
    const user = await getUserFromSupabase()
    if (user instanceof NextResponse) return user

    // Rate limit
    const rl = await rateLimit(storyCreationLimiter, user.id)
    if (rl instanceof NextResponse) return rl

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
        return s409('One of your books has already this title')
    }

    // Ajout du roman
    const [createdStory] = await db.insert(stories).values({
        profileId: user.id,
        title: validTitle,
        slug: buildSlug(validTitle),
        graph: {}
    }).returning({ slug: stories.slug })

    return s201(createdStory)
}

export async function GET(request: NextRequest) {
    const queryParams = request.nextUrl.searchParams

    // Vérification format
    const result = queryParamSchema.safeParse(Object.fromEntries(queryParams))

    if (!result.success) {
        return s400(result.error.issues[0].message)
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

    return s200(storyList)
}
