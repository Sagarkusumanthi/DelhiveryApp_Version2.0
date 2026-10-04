import { NextResponse } from "next/server";
import { listCities } from "@/lib/services/catalogue";
import { handleApiError } from "@/lib/api-errors";

export async function GET() {
  try {
    return NextResponse.json({ cities: await listCities() });
  } catch (err) {
    return handleApiError(err);
  }
}
