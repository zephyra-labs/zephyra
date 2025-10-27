import { Router } from 'express';
import { ContractController } from '../controllers/contractController.js';
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

// --- Specific routes first ---
router.get('/my', authMiddleware, ContractController.getUserContracts);
router.get('/:address/details', authMiddleware, ContractController.getContractDetails);
router.get('/:address/step', authMiddleware, ContractController.getContractStep);

// --- General routes ---
router.get('/', authMiddleware, ContractController.fetchDeployedContracts);
router.post('/log', authMiddleware, ContractController.logContractAction);

export default router;
