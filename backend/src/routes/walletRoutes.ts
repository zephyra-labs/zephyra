import { Router } from 'express';
import { logWalletLogin, logWalletDisconnect, getAllWalletLogs, getWalletLogs } from '../controllers/walletController.js';

const router = Router();

router.post('/log-login', logWalletLogin);
router.post('/log-disconnect', logWalletDisconnect);
router.get('/logs', getAllWalletLogs);
router.get('/:account/logs', getWalletLogs);

export default router;
