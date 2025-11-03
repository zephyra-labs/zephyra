/**
 * @file aggregatedActivityRoutes.ts
 * @description Routes for managing aggregated activities and tags. Admin-protected actions use adminMiddleware.
 */

import { Router } from 'express';
import {
  addAggregatedActivity,
  getAggregatedActivityById,
  getAggregatedActivities,
  addAggregatedTag,
  removeAggregatedTag,
} from '../controllers/aggregatedActivityController';
import { authMiddleware } from "../middlewares/authMiddleware";
import { adminMiddleware } from "../middlewares/adminMiddleware";

const router = Router();

/**
 * Create a new aggregated activity
 * @route POST /aggregated-activities
 * @group AggregatedActivities
 * @security BearerAuth
 * @returns {object} 201 - Newly created aggregated activity
 */
router.post('/', authMiddleware, addAggregatedActivity);

/**
 * Get a single aggregated activity by ID
 * @route GET /aggregated-activities/{id}
 * @group AggregatedActivities
 * @param {string} id.path.required - Aggregated activity ID
 * @security BearerAuth
 * @returns {object} 200 - Aggregated activity details
 */
router.get('/:id', authMiddleware, adminMiddleware, getAggregatedActivityById);

/**
 * Get all aggregated activities
 * @route GET /aggregated-activities
 * @group AggregatedActivities
 * @security BearerAuth
 * @returns {Array.<object>} 200 - List of aggregated activities
 */
router.get('/', authMiddleware, adminMiddleware, getAggregatedActivities);

/**
 * Add a tag to an aggregated activity
 * @route POST /aggregated-activities/{id}/tag
 * @group AggregatedActivities
 * @param {string} id.path.required - Aggregated activity ID
 * @param {string} tag.body.required - Tag name
 * @security BearerAuth
 * @returns {object} 200 - Success message with added tag
 */
router.post('/:id/tag', authMiddleware, adminMiddleware, addAggregatedTag);

/**
 * Remove a tag from an aggregated activity
 * @route DELETE /aggregated-activities/{id}/tag
 * @group AggregatedActivities
 * @param {string} id.path.required - Aggregated activity ID
 * @param {string} tag.query.required - Tag name to remove
 * @security BearerAuth
 * @returns {object} 200 - Success message with removed tag
 */
router.delete('/:id/tag', authMiddleware, adminMiddleware, removeAggregatedTag);

export default router;
