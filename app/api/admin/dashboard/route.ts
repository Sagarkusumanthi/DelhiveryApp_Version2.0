import { NextResponse } from "next/server";
import { adminDashboardStats } from "@/lib/services/admin";
import { requireRole } from "@/lib/session";
import { handleApiError } from "@/lib/api-errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRole("ADMIN");
    return NextResponse.json({ stats: await adminDashboardStats() });
  } catch (err) {
    return handleApiError(err);
  }
}
