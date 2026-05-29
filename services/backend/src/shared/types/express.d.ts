import { Role } from '../constants/roles';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: Role;
        ongId: string | null;
      };
    }
  }
}

export {};
