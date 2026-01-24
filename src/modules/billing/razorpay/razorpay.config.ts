import Razorpay from "razorpay";

import { ENV } from "@shared/config";

// Initialize Razorpay instance
export const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

// Validate Razorpay credentials
export const validateRazorpayConfig = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "Missing Razorpay credentials. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET",
    );
  }

  return {
    isConfigured: true,
    keyId: keyId.substring(0, 10) + "...", // Log masked key for security
  };
};
