import { NextRequest, NextResponse } from "next/server";
import { createGroupGift, listGroupGifts } from "@/lib/services/groupGifts";
import { requireRole } from "@/lib/session";
import { groupGiftSchema } from "@/lib/validation";
import { handleApiError, ValidationError } from "@/lib/api-errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRole("CUSTOMER");
    return NextResponse.json({ groupGifts: await listGroupGifts() });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole("CUSTOMER");
    const body = await req.json();
    const parsed = groupGiftSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Please check the highlighted fields.", parsed.error.flatten().fieldErrors as any);
    }
    const groupGift = await createGroupGift(parsed.data);
    return NextResponse.json({ groupGift }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
