/**
 * @file activityRoutes.ts
 * @description Routes for managing user activity logs. All routes require authentication.
 */

import { Router } from 'express';
import {
  createActivity,
  getActivities,
  getActivityByAccountController,
} from '../controllers/activityController';
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

/**
 * Create a new activity log
 * @route POST /activities
 * @group Activities
 * @security BearerAuth
 * @param {object} body.required - Activity payload
 * @returns {object} 201 - Newly created activity log
 */
router.post('/', authMiddleware, createActivity);

/**
 * Get all activities
 * @route GET /activities
 * @group Activities
 * @security BearerAuth
 * @param {string} account.query - Optional account address filter
 * @param {string} txHash.query - Optional transaction hash filter
 * @param {integer} limit.query - Optional limit for pagination
 * @param {integer} startAfterTimestamp.query - Optional timestamp for pagination
 * @returns {Array.<object>} 200 - List of activity logs
 */
router.get('/', authMiddleware, getActivities);

/**
 * Get activities by account address
 * @route GET /activities/{account}
 * @group Activities
 * @param {string} account.path.required - Wallet address
 * @param {integer} limit.query - Optional limit for pagination
 * @param {integer} startAfterTimestamp.query - Optional timestamp for pagination
 * @security BearerAuth
 * @returns {Array.<object>} 200 - List of activity logs for the account
 */
router.get('/:account', authMiddleware, getActivityByAccountController);

export default router;
