import { describe, it, expect } from "vitest";
import { isValidStoreTransition, isValidAdminOverride, getValidStoreTransitions } from "@/lib/services/orderStateMachine";

describe("store transitions", () => {
  it("allows ORDER_PLACED -> STORE_ACCEPTED", () => {
    expect(isValidStoreTransition("ORDER_PLACED", "STORE_ACCEPTED")).toBe(true);
  });
  it("allows ORDER_PLACED -> REJECTED", () => {
    expect(isValidStoreTransition("ORDER_PLACED", "REJECTED")).toBe(true);
  });
  it("forbids skipping PREPARING_GIFT -> OUT_FOR_DELIVERY", () => {
    expect(isValidStoreTransition("PREPARING_GIFT", "OUT_FOR_DELIVERY")).toBe(false);
  });
  it("forbids reversing OUT_FOR_DELIVERY -> PREPARING_GIFT", () => {
    expect(isValidStoreTransition("OUT_FOR_DELIVERY", "PREPARING_GIFT")).toBe(false);
  });
  it("forbids transitions out of terminal states", () => {
    expect(getValidStoreTransitions("DELIVERED")).toEqual([]);
    expect(getValidStoreTransitions("REJECTED")).toEqual([]);
  });
  it("forbids accepting an already-rejected order", () => {
    expect(isValidStoreTransition("REJECTED", "STORE_ACCEPTED")).toBe(false);
  });
  it("allows the final hop from OUT_FOR_DELIVERY to DELIVERED (customer delivery confirmation)", () => {
    expect(isValidStoreTransition("OUT_FOR_DELIVERY", "DELIVERED")).toBe(true);
  });
});

describe("admin override", () => {
  it("allows overriding to any different status, including correcting a terminal one", () => {
    expect(isValidAdminOverride("DELIVERED", "PREPARING_GIFT")).toBe(true);
    expect(isValidAdminOverride("REJECTED", "STORE_ACCEPTED")).toBe(true);
  });
  it("forbids overriding to the same status", () => {
    expect(isValidAdminOverride("PREPARING_GIFT", "PREPARING_GIFT")).toBe(false);
  });
});
