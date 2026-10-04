import { describe, it, expect } from "vitest";
import { checkoutSchema, loginSchema, reminderSchema, adminOverrideSchema } from "@/lib/validation";

describe("checkoutSchema", () => {
  const base = {
    recipientFirstName: "Meera",
    recipientLastName: "Iyer",
    recipientPhone: "9876543210",
    recipientAddress: "12 Park View Apartments, Banjara Hills",
    items: [{ productId: "petals-1", qty: 1 }],
    deliveryOption: "STANDARD" as const,
    paymentMethod: "UPI" as const,
  };

  it("accepts a valid checkout payload", () => {
    expect(checkoutSchema.safeParse(base).success).toBe(true);
  });

  it("rejects a phone number not starting with 6-9", () => {
    const result = checkoutSchema.safeParse({ ...base, recipientPhone: "1234567890" });
    expect(result.success).toBe(false);
  });

  it("rejects an address under 10 characters", () => {
    const result = checkoutSchema.safeParse({ ...base, recipientAddress: "too short" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty cart", () => {
    const result = checkoutSchema.safeParse({ ...base, items: [] });
    expect(result.success).toBe(false);
  });

  it("rejects a recipient name containing digits", () => {
    const result = checkoutSchema.safeParse({ ...base, recipientFirstName: "Meera2" });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts an email or phone identifier with any non-empty password", () => {
    expect(loginSchema.safeParse({ identifier: "customer@giftapp.demo", password: "Demo@1234" }).success).toBe(true);
    expect(loginSchema.safeParse({ identifier: "9876543210", password: "Demo@1234" }).success).toBe(true);
  });
  it("rejects an empty identifier or password", () => {
    expect(loginSchema.safeParse({ identifier: "", password: "x" }).success).toBe(false);
    expect(loginSchema.safeParse({ identifier: "x", password: "" }).success).toBe(false);
  });
});

describe("reminderSchema", () => {
  it("requires an occasion name of at least 2 characters", () => {
    const result = reminderSchema.safeParse({
      occasionName: "A",
      recipientName: "Mom",
      occasionType: "Birthday",
      date: "2026-05-01",
      remindMe: "1 week before",
    });
    expect(result.success).toBe(false);
  });
});

describe("adminOverrideSchema", () => {
  it("requires a reason of at least 3 characters", () => {
    expect(adminOverrideSchema.safeParse({ targetStatus: "DELIVERED", reason: "ok" }).success).toBe(false);
    expect(adminOverrideSchema.safeParse({ targetStatus: "DELIVERED", reason: "fixed" }).success).toBe(true);
  });
});
