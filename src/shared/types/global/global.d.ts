import type { TokenPayload } from "../../services/token.service";

export interface AdminTokenPayload {
  adminId: string;
  role: "admin" | "superadmin";
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      admin?: AdminTokenPayload;
    }
  }
}

export {};
