import { db } from "@/db";
import { profiles, stories, StoryStatus } from "@/db/schema";
import { s200, s404 } from "@/lib/responses";
import { getUserFromSupabase } from "@/lib/supabase";
import { storyWithoutGraph } from "@/types/story-without-graph";
import { and, eq, ne } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_: NextRequest) {

    // Vérification authentification
    const user = await getUserFromSupabase()
    if (user instanceof NextResponse) return user

    // Vérification profil
    const [profile] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.id, user.id))

    if (!profile) {
        return s404()
    }

    // Récupération de tous les livres (hors archive)
    const storyList = await db
        .select(storyWithoutGraph)
        .from(stories)
        .where(
            and(
                eq(stories.profileId, profile.id),
                ne(stories.status, StoryStatus.archived)
            )
        )

    return s200(storyList)
}