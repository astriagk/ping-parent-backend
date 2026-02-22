import type { File } from "multer";

import type { TokenPayload } from "../../services/token.service";

export interface AdminTokenPayload {
  adminId: string;
  role: UserRole;
  school_id?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      admin?: AdminTokenPayload;
      files?: { [fieldname: string]: File[] };
    }
  }
}

export {};
