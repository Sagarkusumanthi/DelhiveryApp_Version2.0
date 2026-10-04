import { NextResponse } from "next/server";
import { getGroupGift } from "@/lib/services/groupGifts";
import { requireRole } from "@/lib/session";
import { handleApiError } from "@/lib/api-errors";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireRole("CUSTOMER");
    return NextResponse.json({ groupGift: await getGroupGift(params.id) });
  } catch (err) {
    return handleApiError(err);
  }
}
