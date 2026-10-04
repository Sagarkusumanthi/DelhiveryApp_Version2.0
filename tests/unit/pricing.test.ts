import { describe, it, expect } from "vitest";
import { calculateTotals, getDeliveryFee } from "@/lib/services/pricing";

describe("pricing", () => {
  it("calculates subtotal, delivery fee, and total correctly for standard delivery", () => {
    const { subtotal, deliveryFee, total } = calculateTotals([{ price: 1499, qty: 1 }], "STANDARD");
    expect(subtotal).toBe(1499);
    expect(deliveryFee).toBe(49);
    expect(total).toBe(1548);
  });

  it("multiplies by quantity and sums multiple items", () => {
    const { subtotal, total } = calculateTotals(
      [{ price: 500, qty: 3 }, { price: 200, qty: 1 }],
      "EXPRESS"
    );
    expect(subtotal).toBe(1700);
    expect(total).toBe(1799);
  });

  it("uses the correct fee per delivery option", () => {
    expect(getDeliveryFee("STANDARD")).toBe(49);
    expect(getDeliveryFee("EXPRESS")).toBe(99);
    expect(getDeliveryFee("SCHEDULED")).toBe(79);
  });
});
