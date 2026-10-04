import { NextResponse } from "next/server";
import { getStore } from "@/lib/services/catalogue";
import { handleApiError } from "@/lib/api-errors";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    return NextResponse.json({ store: await getStore(params.id) });
  } catch (err) {
    return handleApiError(err);
  }
}
