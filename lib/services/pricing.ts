import { DELIVERY_FEES } from "@/lib/constants";

export type DeliveryOption = keyof typeof DELIVERY_FEES;

export function getDeliveryFee(option: DeliveryOption): number {
  return DELIVERY_FEES[option];
}

export function calculateTotals(items: { price: number; qty: number }[], deliveryOption: DeliveryOption) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const deliveryFee = getDeliveryFee(deliveryOption);
  return { subtotal, deliveryFee, total: subtotal + deliveryFee };
}
