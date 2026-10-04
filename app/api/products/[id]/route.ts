import { NextResponse } from "next/server";
import { getProduct } from "@/lib/services/catalogue";
import { handleApiError } from "@/lib/api-errors";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    return NextResponse.json({ product: await getProduct(params.id) });
  } catch (err) {
    return handleApiError(err);
  }
}
