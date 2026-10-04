import { NextResponse } from "next/server";
import { adminReturnsAnalytics } from "@/lib/services/admin";
import { requireRole } from "@/lib/session";
import { handleApiError } from "@/lib/api-errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRole("ADMIN");
    return NextResponse.json({ analytics: await adminReturnsAnalytics() });
  } catch (err) {
    return handleApiError(err);
  }
}
