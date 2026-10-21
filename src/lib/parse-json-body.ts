import { NextRequest, NextResponse } from "next/server";

export async function parseJsonBody(request: NextRequest): Promise<unknown | NextResponse> {
  let raw;

  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      {
        title: "Bad request",
        status: 400,
        detail: "Invalid request",
      },
      { status: 400 }
    );
  }

  return raw
}