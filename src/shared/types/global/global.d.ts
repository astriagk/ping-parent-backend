import type { TokenPayload } from "../../services/token.service";

export interface AdminTokenPayload {
  adminId: string;
  role: UserRole;
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
