import type { User } from '@prisma/client';
import type { Request } from 'express';

export interface AuthedRequest extends Request {
  user?: User;
  userId?: string;
}


