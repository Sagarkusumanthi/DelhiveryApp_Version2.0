import { NextRequest, NextResponse } from "next/server";
import { addContributor } from "@/lib/services/groupGifts";
import { requireRole } from "@/lib/session";
import { z } from "zod";
import { handleApiError, ValidationError } from "@/lib/api-errors";

const schema = z.object({ name: z.string().trim().min(1), amount: z.number().int().gt(0) });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole("CUSTOMER");
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("name and a positive amount are required.", parsed.error.flatten().fieldErrors as any);
    }
    const contributor = await addContributor(params.id, parsed.data);
    return NextResponse.json({ contributor }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
