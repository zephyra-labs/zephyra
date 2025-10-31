import { Router } from 'express'
import {
  createActivity,
  getActivities,
  getActivityByAccountController,
} from '../controllers/activityController.js'
import { authMiddleware } from "../middlewares/authMiddleware.js"

const router = Router()

/**
 * --- Activity Routes ---
 * Manage user activity logs and records.
 * All routes require authentication.
 */

/**
 * POST /activities
 * Create a new activity log
 */
router.post('/', authMiddleware, createActivity)

/**
 * GET /activities
 * Get all activities (may be filtered by query params)
 */
router.get('/', authMiddleware, getActivities)

/**
 * GET /activities/:account
 * Get activities by account address
 */
router.get('/:account', authMiddleware, getActivityByAccountController)

export default router
