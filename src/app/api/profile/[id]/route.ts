import { db } from "@/db";
import { profiles } from "@/db/schema";
import { profileIdRule } from "@/validations/rules";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    // Vérification format
    const result = profileIdRule.safeParse(id)

    if (!result.success) {
        return NextResponse.json({
            title: 'Bad request',
            status: 400,
            detail: 'Invalid profile id'
        }, {
            status: 400
        })
    }

    const validId = result.data

    // Vérification existence du profil
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, validId)).limit(1)

    if (!profile) {
        return NextResponse.json({
            title: 'Not found',
            status: 404,
            detail: 'Profile not found'
        }, {
            status: 404
        })
    }

    return NextResponse.json({
        data: profile
    }, {
        status: 200
    })
}