export const DELIVERY_FEES = {
  STANDARD: 49,
  EXPRESS: 99,
  SCHEDULED: 79,
} as const;

export const OCCASIONS = ["Birthday", "Anniversary", "Thank you", "Congratulations", "Just because"] as const;

export const ORDER_STATUS_VALUES = [
  "ORDER_PLACED",
  "STORE_ACCEPTED",
  "PREPARING_GIFT",
  "READY_FOR_PICKUP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "REJECTED",
] as const;

// Which statuses a store can move an order to next, from its current status.
export const STORE_NEXT: Record<string, string[]> = {
  ORDER_PLACED: ["STORE_ACCEPTED", "REJECTED"],
  STORE_ACCEPTED: ["PREPARING_GIFT"],
  PREPARING_GIFT: ["READY_FOR_PICKUP"],
  READY_FOR_PICKUP: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: [],
  REJECTED: [],
};
