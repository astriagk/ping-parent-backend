import { customAlphabet } from "nanoid";

import { AlphabetType } from "@constants";
import { ALPHABETS, GenerateUniqueCodeOptions } from "@models/utills.types";

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex =
    /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone);
};

export const isStrongPassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

export const generateOTP = (length = 6): string => {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

export const generateRandomToken = (length = 32): string => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < length; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
};

export const sanitizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

export const sanitizePhoneNumber = (phone: string): string => {
  return phone.replace(/\s+/g, "").trim();
};

export const parseJSON = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
};

export const omit = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach((key) => delete result[key]);
  return result;
};

export const pick = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};

export const normalizePhone = (phone: any) => {
  if (!phone) return null;
  let s = String(phone).trim();
  // keep leading + then digits
  const plus = s.startsWith("+") ? "+" : "";
  s = s.replace(/[^0-9]/g, "");
  const combined = plus + s;
  // basic length sanity check
  const digits = s.length;
  if (digits < 7 || digits > 15) return null;
  return combined;
};

export const validatePhone = (phone: any) => {
  const normalized = normalizePhone(phone);
  return normalized !== null;
};

// Copies specified fields from source to target, trimming string values.
export const assignTrimmedFields = (
  target: any,
  source: any,
  fields: string[],
): void => {
  fields.forEach((field) => {
    if (source[field] !== undefined) {
      const value = source[field];
      target[field] = typeof value === "string" ? value.trim() : value;
    }
  });
};

/**
 * Generate a unique code with a custom prefix
 * @param prefix - The prefix for the code (e.g., "SCH", "STU", "PAR")
 * @param options - Configuration options for the unique code generation
 * @param options.length - Length of the random part (default: 6)
 * @param options.alphabetType - Type of alphabet to use: 'alphanumeric', 'uppercase', 'lowercase', 'numbers' (default: 'alphanumeric')
 * @param options.separator - Separator between prefix and unique part (default: no separator)
 * @returns A unique code string
 *
 * @example
 * generateUniqueCode("SCH") // SCH4k9Lm2
 * generateUniqueCode("SCH", { length: 8 }) // SCH7n2Px9Qs
 * generateUniqueCode("SCH", { separator: "-" }) // SCH-4k9Lm2
 * generateUniqueCode("SCH", { alphabetType: "uppercase" }) // SCHAK4MN9
 * generateUniqueCode("STU", { alphabetType: "numbers", length: 10 }) // STU1234567890
 */
export const generateUniqueCode = (
  prefix: string,
  options?: GenerateUniqueCodeOptions,
): string => {
  const {
    length = 8,
    alphabetType = AlphabetType.Alphanumeric,
    separator = "-",
  } = options || {};

  const alphabet = ALPHABETS[alphabetType];
  const generateId = customAlphabet(alphabet, length);
  return `${prefix}${separator}${generateId()}`;
};
