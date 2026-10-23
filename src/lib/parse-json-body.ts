import { NextRequest, NextResponse } from "next/server";
import { s400 } from "./responses";

export async function parseJsonBody(request: NextRequest): Promise<unknown | NextResponse> {
  let raw;

  try {
    raw = await request.json();
  } catch {
    return s400()
  }

  return raw
}