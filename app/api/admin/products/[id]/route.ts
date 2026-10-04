import { NextRequest, NextResponse } from "next/server";
import { adminUpdateProduct, adminGetProductDetail } from "@/lib/services/admin";
import { requireRole } from "@/lib/session";
import { productFormSchema } from "@/lib/validation";
import { handleApiError, ValidationError } from "@/lib/api-errors";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireRole("ADMIN");
    return NextResponse.json(await adminGetProductDetail(params.id));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole("ADMIN");
    const body = await req.json();
    const parsed = productFormSchema.partial().safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Please check the highlighted fields.", parsed.error.flatten().fieldErrors as any);
    }
    const product = await adminUpdateProduct(params.id, parsed.data);
    return NextResponse.json({ product });
  } catch (err) {
    return handleApiError(err);
  }
}
