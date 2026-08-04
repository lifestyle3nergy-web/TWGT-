// src/auth/index.ts — auth middleware placeholders
import { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Placeholder JWT auth check
  const auth = req.headers.authorization;
  if (!auth) {
    return res.status(401).json({ error: 'Missing authorization' });
  }
  // TODO: verify JWT using JWT_SECRET
  // Attach user to req.user
  next();
}

export const auth = {
  requireAuth,
};
