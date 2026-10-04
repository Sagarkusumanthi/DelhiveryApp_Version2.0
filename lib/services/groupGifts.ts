import "server-only";
import { getDb } from "@/lib/db";
import { NotFoundError } from "@/lib/api-errors";
import type { z } from "zod";
import type { groupGiftSchema } from "@/lib/validation";

const INCLUDE = { contributors: true, deliveryCity: true };

export async function listGroupGifts() {
  return getDb().groupGift.findMany({ include: INCLUDE, orderBy: { deliveryDate: "asc" } });
}

export async function getGroupGift(id: string) {
  const groupGift = await getDb().groupGift.findUnique({ where: { id }, include: INCLUDE });
  if (!groupGift) throw new NotFoundError("Group gift not found.");
  return groupGift;
}

export async function createGroupGift(input: z.infer<typeof groupGiftSchema>) {
  return getDb().groupGift.create({
    data: {
      title: input.title,
      occasionType: input.occasionType,
      recipientName: input.recipientName,
      deliveryCityId: input.deliveryCityId,
      deliveryDate: new Date(input.deliveryDate),
      goalAmount: input.goalAmount,
      splitType: input.splitType,
      message: input.message,
      productIds: input.productIds,
      contributors: { create: input.contributors.map((c) => ({ name: c.name, amount: c.amount, paid: !!c.paid })) },
    },
    include: INCLUDE,
  });
}

export async function addContributor(groupGiftId: string, input: { name: string; amount: number }) {
  return getDb().groupGiftContributor.create({
    data: { groupGiftId, name: input.name, amount: input.amount, paid: false },
  });
}

export async function setContributorPaid(contributorId: string, paid: boolean) {
  return getDb().groupGiftContributor.update({ where: { id: contributorId }, data: { paid } });
}
