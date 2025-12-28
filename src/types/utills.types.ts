import { AlphabetType } from "@constants";

export const ALPHABETS: Record<AlphabetType, string> = {
  [AlphabetType.Alphanumeric]:
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  [AlphabetType.Uppercase]: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  [AlphabetType.Lowercase]: "0123456789abcdefghijklmnopqrstuvwxyz",
  [AlphabetType.Numbers]: "0123456789",
};

export interface GenerateUniqueCodeOptions {
  length?: number; // Default: 8
  alphabetType?: AlphabetType; // Default: Alphanumeric
  separator?: string; // Default: "-"
}
