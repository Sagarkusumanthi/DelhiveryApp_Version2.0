import { NextRequest, NextResponse } from "next/server";
import { updateMyProduct, getMyStoreId } from "@/lib/services/storeOwner";
import { requireRole } from "@/lib/session";
import { productFormSchema } from "@/lib/validation";
import { handleApiError, ValidationError } from "@/lib/api-errors";
import { ForbiddenError } from "@/lib/session";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole("STORE_OWNER");
    const storeId = await getMyStoreId(session.userId);
    if (!storeId) throw new ForbiddenError("No store is linked to this account.");

    const body = await req.json();
    const parsed = productFormSchema.partial().safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Please check the highlighted fields.", parsed.error.flatten().fieldErrors as any);
    }
    const product = await updateMyProduct(storeId, params.id, parsed.data);
    return NextResponse.json({ product });
  } catch (err) {
    return handleApiError(err);
  }
}
