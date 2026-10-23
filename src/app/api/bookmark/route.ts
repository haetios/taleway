import { db } from "@/db";
import { bookmarks, stories, StoryStatus } from "@/db/schema";
import { parseJsonBody } from "@/lib/parse-json-body";
import { bookmarkLimiter, rateLimit } from "@/lib/rate-limit";
import { s200, s400, s404 } from "@/lib/responses";
import { getUserFromSupabase } from "@/lib/supabase";
import { bookmarkSchema } from "@/validations/schemas/bookmark";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const body = await parseJsonBody(request)
    if (body instanceof NextResponse) return body

    // Vérification format
    const result = bookmarkSchema.safeParse(body)

    if (!result.success) {
        return s400(result.error.issues[0].message)
    }

    const { slug, nodeId, variables } = result.data

    // Vérification authentification
    const user = await getUserFromSupabase()
    if (user instanceof NextResponse) return user

    // Rate limit
    const rl = await rateLimit(bookmarkLimiter, user.id)
    if (rl instanceof NextResponse) return rl

    // Vérification existence du roman
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
        return s404('Story not found')
    }

    // Création ou mise à jour du marque-page
    await db.insert(bookmarks)
    .values({ storyId: existingStory.id, profileId: user.id, nodeId, variables })
    .onConflictDoUpdate({
        target: [bookmarks.profileId, bookmarks.storyId],
        set: { nodeId, variables },
    })

    return s200()
}