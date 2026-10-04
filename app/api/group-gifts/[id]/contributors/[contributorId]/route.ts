import { NextRequest, NextResponse } from "next/server";
import { setContributorPaid } from "@/lib/services/groupGifts";
import { requireRole } from "@/lib/session";
import { contributePaymentSchema } from "@/lib/validation";
import { handleApiError, ValidationError } from "@/lib/api-errors";

export async function PATCH(req: NextRequest, { params }: { params: { contributorId: string } }) {
  try {
    await requireRole("CUSTOMER");
    const body = await req.json();
    const parsed = contributePaymentSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError("paid (boolean) is required.");
    const contributor = await setContributorPaid(params.contributorId, parsed.data.paid);
    return NextResponse.json({ contributor });
  } catch (err) {
    return handleApiError(err);
  }
}
