import "server-only";
import { getDb } from "@/lib/db";

export async function listReminders(userId: string) {
  return getDb().reminder.findMany({ where: { userId }, orderBy: { date: "asc" } });
}

export async function createReminder(userId: string, input: {
  occasionName: string; recipientName: string; occasionType: string; date: string;
  repeatYearly?: boolean; remindMe: string; giftCategory?: string; note?: string;
}) {
  return getDb().reminder.create({
    data: {
      userId,
      occasionName: input.occasionName,
      recipientName: input.recipientName,
      occasionType: input.occasionType,
      date: new Date(input.date),
      repeatYearly: !!input.repeatYearly,
      remindMe: input.remindMe,
      giftCategory: input.giftCategory,
      note: input.note,
    },
  });
}

export async function updateReminder(id: string, input: Partial<{
  occasionName: string; recipientName: string; occasionType: string; date: string;
  repeatYearly: boolean; remindMe: string; giftCategory: string; note: string; giftPlanned: boolean;
}>) {
  return getDb().reminder.update({
    where: { id },
    data: {
      ...(input.occasionName ? { occasionName: input.occasionName } : {}),
      ...(input.recipientName ? { recipientName: input.recipientName } : {}),
      ...(input.occasionType ? { occasionType: input.occasionType } : {}),
      ...(input.date ? { date: new Date(input.date) } : {}),
      ...(input.repeatYearly !== undefined ? { repeatYearly: input.repeatYearly } : {}),
      ...(input.remindMe ? { remindMe: input.remindMe } : {}),
      ...(input.giftCategory !== undefined ? { giftCategory: input.giftCategory } : {}),
      ...(input.note !== undefined ? { note: input.note } : {}),
      ...(input.giftPlanned !== undefined ? { giftPlanned: input.giftPlanned } : {}),
    },
  });
}

export async function deleteReminder(id: string) {
  await getDb().reminder.delete({ where: { id } });
}
