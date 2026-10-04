import { NextRequest, NextResponse } from "next/server";
import { adminUpdateStore } from "@/lib/services/admin";
import { requireRole } from "@/lib/session";
import { z } from "zod";
import { handleApiError, ValidationError } from "@/lib/api-errors";

const schema = z.object({ open: z.boolean() });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole("ADMIN");
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) throw new ValidationError("open (boolean) is required.");
    const store = await adminUpdateStore(params.id, parsed.data);
    return NextResponse.json({ store });
  } catch (err) {
    return handleApiError(err);
  }
}
