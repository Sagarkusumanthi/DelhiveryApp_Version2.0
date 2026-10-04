import { NextResponse } from "next/server";
import { getStoreReports, getMyStoreId } from "@/lib/services/storeOwner";
import { requireRole, ForbiddenError } from "@/lib/session";
import { handleApiError } from "@/lib/api-errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireRole("STORE_OWNER");
    const storeId = await getMyStoreId(session.userId);
    if (!storeId) throw new ForbiddenError("No store is linked to this account.");
    return NextResponse.json({ reports: await getStoreReports(storeId) });
  } catch (err) {
    return handleApiError(err);
  }
}
