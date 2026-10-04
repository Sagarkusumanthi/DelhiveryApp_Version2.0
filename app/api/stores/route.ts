import { NextRequest, NextResponse } from "next/server";
import { listStores } from "@/lib/services/catalogue";
import { handleApiError } from "@/lib/api-errors";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cityId = searchParams.get("cityId") ?? undefined;
    const category = searchParams.get("category") ?? undefined;
    return NextResponse.json({ stores: await listStores({ cityId, category }) });
  } catch (err) {
    return handleApiError(err);
  }
}
