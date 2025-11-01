/**
 * @file adminMiddleware.ts
 * @description Middleware to restrict access to admin users only.
 */

import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './authMiddleware.js';

/**
 * Admin access middleware
 * @param {AuthRequest} req - Express request with user object attached
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next middleware
 * @returns {void|Response} 401 if not authenticated, 403 if not admin
 */
export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
  }

  next();
}
