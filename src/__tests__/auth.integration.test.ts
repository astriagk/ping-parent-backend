import request from "supertest";
import app from "../app";
import { signAccessToken } from "../utils/jwt";
import * as userService from "../services/user.service";

jest.mock("../services/user.service");

describe("GET /api/auth/verify-token", () => {
  it("returns user data when token is valid", async () => {
    const payload = {
      userId: "u-test",
      email: "parent@example.com",
      role: "parent",
    };
    const token = signAccessToken(payload);

    (userService.getUserById as jest.Mock).mockResolvedValue({
      _id: payload.userId,
      email: payload.email,
      name: "Test",
      createdAt: new Date(),
    });

    const res = await request(app)
      .get("/api/auth/verify-token")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.userId).toBe(payload.userId);
    expect(res.body.data.email).toBe(payload.email);
  });
});
