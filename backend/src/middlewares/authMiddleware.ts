/**
 * @file authMiddleware.ts
 * @description Middleware to authenticate users via JWT.
 */

import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { User } from '../types/User.js';
import { UserModel } from '../models/userModel.js';

/**
 * Extends Express Request to include `user` object after authentication
 */
export interface AuthRequest extends Request {
  user?: User;
}

/**
 * Auth middleware
 * Verifies JWT token in Authorization header and attaches user to request.
 *
 * @param {AuthRequest} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {void|Response} 401 if token missing/invalid, 404 if user not found
 */
export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Missing token' });

  try {
    const secret = process.env.JWT_SECRET!;
    const payload = jwt.verify(token, secret) as { address: string };

    const user = await UserModel.getByAddress(payload.address);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    req.user = user;
    next();
  } catch (err: unknown) {
    let message = 'Unauthorized';

    if (err instanceof Error) {
      console.warn('Auth error:', err.message);
      message = err.message;
    } else {
      console.warn('Auth error:', err);
    }

    return res.status(401).json({ success: false, message });
  }
}
