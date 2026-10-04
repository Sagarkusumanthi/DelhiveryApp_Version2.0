import "server-only";
import { randomUUID } from "crypto";
import { getDb } from "@/lib/db";
import { NotFoundError } from "@/lib/api-errors";
import type { z } from "zod";
import type { groupGiftSchema } from "@/lib/validation";

const INCLUDE = { contributors: true, City: true, GroupGiftItem: { include: { Product: true } } };

function normalizeOccasion(value: string): "BIRTHDAY" | "ANNIVERSARY" | "WEDDING" | "FESTIVAL" | "OTHER" {
  const v = value.trim().toUpperCase();
  if (v === "BIRTHDAY" || v === "ANNIVERSARY" || v === "WEDDING" || v === "FESTIVAL") return v;
  return "OTHER";
}

function mapGift(gift: any) {
  return {
    ...gift,
    deliveryCityId: gift.cityId,
    deliveryCity: gift.City,
    goalAmount: Number(gift.goalAmount),
    splitType: gift.splitType.toLowerCase(),
    productIds: gift.GroupGiftItem?.map((i: any) => i.productId) ?? [],
  };
}

export async function listGroupGifts() {
  const rows = await getDb().groupGift.findMany({ include: INCLUDE, orderBy: { deliveryDate: "asc" } });
  return rows.map(mapGift);
}

export async function getGroupGift(id: string) {
  const row = await getDb().groupGift.findUnique({ where: { id }, include: INCLUDE });
  if (!row) throw new NotFoundError("Group gift not found.");
  return mapGift(row);
}

export async function createGroupGift(userId: string, input: z.infer<typeof groupGiftSchema>) {
  const created = await getDb().groupGift.create({
    data: {
      createdById: userId,
      title: input.title,
      occasionType: normalizeOccasion(input.occasionType),
      recipientName: input.recipientName,
      cityId: input.deliveryCityId,
      deliveryDate: new Date(input.deliveryDate),
      goalAmount: input.goalAmount,
      splitType: input.splitType === "custom" ? "CUSTOM" : "EQUAL",
      message: input.message,
      updatedAt: new Date(),
      contributors: { create: input.contributors.map((c) => ({ id: randomUUID(), name: c.name, amount: c.amount, paid: !!c.paid })) },
      GroupGiftItem: { create: input.productIds.map((productId) => ({ id: randomUUID(), productId })) },
    },
    include: INCLUDE,
  });
  return mapGift(created);
}

export async function addContributor(groupGiftId: string, input: { name: string; amount: number }) {
  return getDb().groupGiftContributor.create({
    data: { id: randomUUID(), groupGiftId, name: input.name, amount: input.amount, paid: false },
  });
}

export async function setContributorPaid(contributorId: string, paid: boolean) {
  return getDb().groupGiftContributor.update({ where: { id: contributorId }, data: { paid } });
}
