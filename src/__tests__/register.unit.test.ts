import {
  validateEmail,
  validatePassword,
  normalizePhone,
} from "../utils/validation";

describe("validation utils", () => {
  it("validates good email", () => {
    expect(validateEmail("test@example.com")).toBe(true);
  });

  it("rejects bad email", () => {
    expect(validateEmail("bad-email")).toBe(false);
  });

  it("validates strong password", () => {
    expect(validatePassword("SecurePass123")).toBe(true);
  });

  it("rejects weak password", () => {
    expect(validatePassword("short" as any)).toBe(false);
  });

  it("normalizes phone numbers", () => {
    expect(normalizePhone("+1 (234) 567-8900")).toBe("+12345678900");
  });
});
