import { NextRequest, NextResponse } from "next/server";
import { getMyStore, updateStoreProfile, getMyStoreId } from "@/lib/services/storeOwner";
import { requireRole, ForbiddenError } from "@/lib/session";
import { storeProfileSchema } from "@/lib/validation";
import { handleApiError, ValidationError } from "@/lib/api-errors";

export async function GET() {
  try {
    const session = await requireRole("STORE_OWNER");
    const storeId = await getMyStoreId(session.userId);
    if (!storeId) throw new ForbiddenError("No store is linked to this account.");
    return NextResponse.json({ store: await getMyStore(storeId) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireRole("STORE_OWNER");
    const storeId = await getMyStoreId(session.userId);
    if (!storeId) throw new ForbiddenError("No store is linked to this account.");

    const body = await req.json();
    const parsed = storeProfileSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Please check the highlighted fields.", parsed.error.flatten().fieldErrors as any);
    }
    const store = await updateStoreProfile(storeId, parsed.data);
    return NextResponse.json({ store });
  } catch (err) {
    return handleApiError(err);
  }
}
