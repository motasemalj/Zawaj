import { NextFunction, Response } from 'express';
import { prisma } from '../prisma';
import { AuthedRequest } from '../types';

// Dev-only auth: expects x-user-id header with a valid User ID
// Phone OTP flow is intentionally commented to enable local run without subscriptions.
export async function authMiddleware(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const userId = (req.headers['x-user-id'] as string) || '';
    if (!userId) {
      return res.status(401).json({ error: 'Missing x-user-id header in dev mode' });
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid user' });
    }
    req.user = user;
    req.userId = userId; // Add userId to request
    next();
  } catch (e) {
    next(e);
  }
}


