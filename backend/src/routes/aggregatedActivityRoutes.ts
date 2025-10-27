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

router.post('/', authMiddleware, addAggregatedActivity)

router.get('/:id', authMiddleware, adminMiddleware, getAggregatedActivityById)

router.get('/', authMiddleware, adminMiddleware, getAggregatedActivities)

router.post('/:id/tag', authMiddleware, adminMiddleware, addAggregatedTag)

router.delete('/:id/tag', authMiddleware, adminMiddleware, removeAggregatedTag)

export default router
