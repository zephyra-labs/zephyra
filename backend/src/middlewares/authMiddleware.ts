import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { User } from '../types/User.js'
import { UserModel } from '../models/UserModel.js'

export interface AuthRequest extends Request {
  user?: User
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Missing or invalid Authorization header' })
  }

  const token = authHeader.split(' ')[1]
  if (!token) return res.status(401).json({ success: false, message: 'Missing token' })

  try {
    const secret = process.env.JWT_SECRET!
    const payload = jwt.verify(token, secret) as { address: string }

    const user = await UserModel.getByAddress(payload.address)
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })

    req.user = user
    next()
  } catch (err: any) {
    console.warn('Auth error:', err.message)
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }
}
