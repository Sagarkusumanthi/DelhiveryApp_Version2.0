import { NextResponse } from "next/server";
import { listCategories } from "@/lib/services/catalogue";
import { handleApiError } from "@/lib/api-errors";

export async function GET() {
  try {
    return NextResponse.json({ categories: await listCategories() });
  } catch (err) {
    return handleApiError(err);
  }
}
