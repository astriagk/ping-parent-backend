export const validateEmail = (email: any) => {
  if (!email || typeof email !== "string") return false;
  const re = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  return re.test(email.toLowerCase());
};

export const validatePassword = (pw: any) => {
  if (!pw || typeof pw !== "string") return false;
  if (pw.length < 8) return false;
  if (!/[a-z]/.test(pw)) return false;
  if (!/[A-Z]/.test(pw)) return false;
  if (!/[0-9]/.test(pw)) return false;
  return true;
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
