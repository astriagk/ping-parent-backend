import { signAccessToken, verifyToken } from "../utils/jwt";

describe("JWT utils", () => {
  it("signs and verifies access tokens", () => {
    const payload = { userId: "u1", email: "a@b.com", role: "parent" };
    const token = signAccessToken(payload);
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
  });
});
