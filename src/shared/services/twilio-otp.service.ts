import twilio from "twilio";

import { DEV_MESSAGES } from "@shared/constants/messages";
import { logger } from "@shared/utils";

interface VerificationResponse {
  status: string;
  sid?: string;
}

interface VerificationCheckResponse {
  status: string;
  valid: boolean;
}

const isDevelopment = process.env.NODE_ENV === "dev";
const TEST_OTP_CODE = "111111";
const TEST_OTP_SID = "test-sid-dev-mode";

const validateEnv = (): void => {
  if (isDevelopment) {
    logger.info(DEV_MESSAGES.TWILIO_OTP.DEV_MODE_ENABLED);
    logger.info(
      DEV_MESSAGES.TWILIO_OTP.TEST_OTP_CODE.replace("{code}", TEST_OTP_CODE),
    );
    return;
  }

  const required = [
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_VERIFY_SERVICE_SID",
  ];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required Twilio environment variables: ${missing.join(", ")}`,
    );
  }
};

validateEnv();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

const client = !isDevelopment ? twilio(accountSid!, authToken!) : null;

const isValidPhone = (phone: string): boolean => {
  return /^\+?[1-9]\d{1,14}$/.test(phone);
};

export async function sendOtp(phone: string): Promise<VerificationResponse> {
  if (!phone || !isValidPhone(phone)) {
    throw new Error(
      "Invalid phone number format. Please use E.164 format (e.g., +919876543210)",
    );
  }

  // Development mode: skip actual OTP sending
  if (isDevelopment) {
    const message = DEV_MESSAGES.TWILIO_OTP.OTP_WOULD_BE_SENT.replace(
      "{phone}",
      phone,
    ).replace("{code}", TEST_OTP_CODE);
    logger.info(message);
    return {
      status: "pending",
      sid: TEST_OTP_SID,
    };
  }

  try {
    const result = await client!.verify.v2
      .services(verifyServiceSid!)
      .verifications.create({ to: phone, channel: "sms" });

    return {
      status: result.status,
      sid: result.sid,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to send OTP";
    throw new Error(`Twilio sendOtp error for ${phone}: ${errorMessage}`);
  }
}

export async function verifyOtp(
  phone: string,
  code: string,
): Promise<VerificationCheckResponse> {
  if (!phone || !isValidPhone(phone)) {
    throw new Error(
      "Invalid phone number format. Please use E.164 format (e.g., +919876543210)",
    );
  }

  if (!code || !/^\d{4,8}$/.test(code)) {
    throw new Error("Invalid OTP code format. Code must be 4-8 digits");
  }

  // Development mode: verify against test OTP
  if (isDevelopment) {
    const isValid = code === TEST_OTP_CODE;
    const result = isValid ? "ACCEPTED" : "REJECTED";
    const message = DEV_MESSAGES.TWILIO_OTP.OTP_VERIFICATION_RESULT.replace(
      "{phone}",
      phone,
    )
      .replace("{result}", result)
      .replace("{code}", code)
      .replace("{expected}", TEST_OTP_CODE);
    logger.info(message);
    return {
      status: isValid ? "approved" : "failed",
      valid: isValid,
    };
  }

  try {
    const result = await client!.verify.v2
      .services(verifyServiceSid!)
      .verificationChecks.create({ to: phone, code });

    return {
      status: result.status,
      valid: result.status === "approved",
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to verify OTP";
    throw new Error(`Twilio verifyOtp error for ${phone}: ${errorMessage}`);
  }
}
