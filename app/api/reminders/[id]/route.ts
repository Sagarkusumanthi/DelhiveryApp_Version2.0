import { NextRequest, NextResponse } from "next/server";
import { deleteReminder, listReminders, updateReminder } from "@/lib/services/reminders";
import { requireRole } from "@/lib/session";
import { reminderSchema } from "@/lib/validation";
import { handleApiError, NotFoundError, ValidationError } from "@/lib/api-errors";

async function assertOwnsReminder(userId: string, reminderId: string) {
  const mine = await listReminders(userId);
  if (!mine.some((r: { id: string }) => r.id === reminderId)) throw new NotFoundError("Reminder not found.");
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole("CUSTOMER");
    await assertOwnsReminder(session.userId, params.id);
    const body = await req.json();
    const parsed = reminderSchema.partial().safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Please check the highlighted fields.", parsed.error.flatten().fieldErrors as any);
    }
    const reminder = await updateReminder(params.id, parsed.data);
    return NextResponse.json({ reminder });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole("CUSTOMER");
    await assertOwnsReminder(session.userId, params.id);
    await deleteReminder(params.id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return handleApiError(err);
  }
}
