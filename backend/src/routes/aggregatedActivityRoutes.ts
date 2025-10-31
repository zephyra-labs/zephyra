import { Router } from 'express'
import {
  addAggregatedActivity,
  getAggregatedActivityById,
  getAggregatedActivities,
  addAggregatedTag,
  removeAggregatedTag,
} from '../controllers/aggregatedActivityController.js'
import { authMiddleware } from "../middlewares/authMiddleware.js"
import { adminMiddleware } from "../middlewares/adminMiddleware.js"

const router = Router()

/**
 * --- Aggregated Activity Routes ---
 * Manage aggregated activities and tags.
 * Admin-only routes are protected with adminMiddleware.
 */

/**
 * POST /aggregated-activities
 * Create a new aggregated activity
 */
router.post('/', authMiddleware, addAggregatedActivity)

/**
 * GET /aggregated-activities/:id
 * Get a single aggregated activity by ID (Admin only)
 */
router.get('/:id', authMiddleware, adminMiddleware, getAggregatedActivityById)

/**
 * GET /aggregated-activities
 * Get all aggregated activities (Admin only)
 */
router.get('/', authMiddleware, adminMiddleware, getAggregatedActivities)

/**
 * POST /aggregated-activities/:id/tag
 * Add a tag to an aggregated activity (Admin only)
 */
router.post('/:id/tag', authMiddleware, adminMiddleware, addAggregatedTag)

/**
 * DELETE /aggregated-activities/:id/tag
 * Remove a tag from an aggregated activity (Admin only)
 */
router.delete('/:id/tag', authMiddleware, adminMiddleware, removeAggregatedTag)

export default router
