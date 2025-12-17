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

describe("POST /api/auth/register", () => {
  it("registers a new parent and returns token + user", async () => {
    const payload = {
      email: "newparent@example.com",
      password: "SecurePass123",
      firstName: "Jane",
      lastName: "Smith",
      phone: "+1234567890",
    };

    (userService.getUserByEmail as jest.Mock).mockResolvedValue(null);
    (userService.createUser as jest.Mock).mockResolvedValue({
      insertedId: "u-new",
    });

    const res = await request(app).post("/api/auth/register").send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(payload.email);
    expect(res.body.data.token).toBeTruthy();
  });
});

describe("POST /api/auth/login", () => {
  it("authenticates user and returns token + user", async () => {
    const payload = {
      email: "parent@example.com",
      password: "secure123A",
    };

    const fakeUser = {
      _id: "u-1",
      email: payload.email,
      passwordHash: "$2a$10$abcdefghijklmnopqrstuvwxyzabcdefg0123456789", // bcrypt hash stub
      firstName: "John",
      lastName: "Doe",
      role: "parent",
      phone: "+1234567890",
    };

    (userService.getUserByEmail as jest.Mock).mockResolvedValue(fakeUser);
    // mock bcrypt.compare by replacing implementation temporarily
    const bcrypt = require("bcryptjs");
    jest.spyOn(bcrypt, "compare").mockResolvedValue(true);

    const res = await request(app).post("/api/auth/login").send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.user.email).toBe(payload.email);
  });
});

describe("POST /api/auth/forgot-password & verify & reset", () => {
  it("generates OTP, verifies it, and resets password", async () => {
    const email = "parent@example.com";

    const fakeUser = {
      _id: "u-1",
      email,
      passwordHash: "$2a$10$stubhash",
      firstName: "John",
      lastName: "Doe",
    };

    (userService.getUserByEmail as jest.Mock).mockResolvedValue(fakeUser);

    const passwordResetService = require("../services/passwordReset.service");
    jest
      .spyOn(passwordResetService, "createOtpForEmail")
      .mockResolvedValue("rid-1");
    jest
      .spyOn(passwordResetService, "verifyOtpAndCreateResetToken")
      .mockResolvedValue("rtoken-1");
    jest
      .spyOn(passwordResetService, "consumeResetToken")
      .mockResolvedValue(email);

    (userService.updateUserPassword as jest.Mock) = jest
      .fn()
      .mockResolvedValue({ modifiedCount: 1 });

    const forgot = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email });
    expect(forgot.status).toBe(200);

    const verify = await request(app)
      .post("/api/auth/verify-otp")
      .send({ email, otp: "123456" });
    expect(verify.status).toBe(200);
    expect(verify.body.data.resetToken).toBe("rtoken-1");

    const reset = await request(app)
      .post("/api/auth/reset-password")
      .send({ resetToken: "rtoken-1", newPassword: "NewPass123A" });
    expect(reset.status).toBe(200);
    expect(reset.body.success).toBe(true);
  });
});
