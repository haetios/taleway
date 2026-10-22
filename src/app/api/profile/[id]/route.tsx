import { db } from "@/db";
import { profiles } from "@/db/schema";
import { authError, getSupabaseServerClient, internalServerError, unauthorized } from "@/lib/supabase";
import { profileIdRule } from "@/validations/rules";
import { isAuthApiError } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

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