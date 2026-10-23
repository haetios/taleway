import { db } from "@/db";
import { profiles } from "@/db/schema";
import { s200, s400, s404 } from "@/lib/responses";
import { profileIdRule } from "@/validations/rules";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    // Vérification format
    const result = profileIdRule.safeParse(id)

    if (!result.success) {
        return s400('Invalid profile id')
    }

    const validId = result.data

    // Vérification existence du profil
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, validId)).limit(1)

    if (!profile) {
        return s404('Profile not found')
    }

    return s200(profile)
}