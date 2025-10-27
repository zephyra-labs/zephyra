import { Router } from 'express';
import { createActivity, getActivities, getActivityByAccountController } from '../controllers/activityController.js';
import { authMiddleware } from "../middlewares/authMiddleware.js"

const router = Router();

router.post('/', authMiddleware, createActivity);

router.get('/', authMiddleware, getActivities);

router.get('/:account', authMiddleware, getActivityByAccountController);

export default router;
