import { stories } from "@/db/schema";

export const storyWithoutGraph = {
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
}

export type StoryWithoutGraph = typeof storyWithoutGraph