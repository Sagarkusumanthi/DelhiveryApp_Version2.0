import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("password hashing", () => {
  it("hashes a password into the scrypt:<salt>:<hash> format", async () => {
    const hash = await hashPassword("Demo@1234");
    const parts = hash.split(":");
    expect(parts[0]).toBe("scrypt");
    expect(parts.length).toBe(3);
  });

  it("verifies the correct password against its own hash", async () => {
    const hash = await hashPassword("Demo@1234");
    expect(await verifyPassword("Demo@1234", hash)).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("Demo@1234");
    expect(await verifyPassword("WrongPassword", hash)).toBe(false);
  });

  it("produces a different hash each time (random salt)", async () => {
    const a = await hashPassword("Demo@1234");
    const b = await hashPassword("Demo@1234");
    expect(a).not.toBe(b);
  });

  it("rejects a malformed stored value", async () => {
    expect(await verifyPassword("Demo@1234", "not-a-valid-hash")).toBe(false);
  });
});
