import { NextRequest, NextResponse } from "next/server";
import { createReminder, listReminders } from "@/lib/services/reminders";
import { requireRole } from "@/lib/session";
import { reminderSchema } from "@/lib/validation";
import { handleApiError, ValidationError } from "@/lib/api-errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireRole("CUSTOMER");
    return NextResponse.json({ reminders: await listReminders(session.userId) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole("CUSTOMER");
    const body = await req.json();
    const parsed = reminderSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Please check the highlighted fields.", parsed.error.flatten().fieldErrors as any);
    }
    const reminder = await createReminder(session.userId, parsed.data);
    return NextResponse.json({ reminder }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
