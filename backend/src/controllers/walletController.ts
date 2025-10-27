import { Request, Response } from 'express';
import admin from 'firebase-admin';
import WalletLogDTO from '../dtos/walletDTO.js';
import { createWalletLog } from '../models/walletModel.js';
import { db } from '../config/firebase.js'

const collection = db.collection('walletLogs');

// POST /wallet/log-login
export const logWalletLogin = async (req: Request, res: Response) => {
  try {
    const { account } = req.body;
    if (!account) return res.status(400).json({ error: 'Missing account' });

    const dto = new WalletLogDTO({ account, action: 'connect' });
    dto.validate();

    await createWalletLog(dto);
    res.json({ success: true, log: dto.toJSON() });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

// POST /wallet/log-disconnect
export const logWalletDisconnect = async (req: Request, res: Response) => {
  try {
    const { account } = req.body;
    if (!account) return res.status(400).json({ error: 'Missing account' });

    const dto = new WalletLogDTO({ account, action: 'disconnect' });
    dto.validate();

    await createWalletLog(dto);

    // --- Hapus cookie ---
    res.setHeader('Set-Cookie', 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure');

    res.json({ success: true, log: dto.toJSON() });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

// GET /wallet/logs
export const getAllWalletLogs = async (req: Request, res: Response) => {
  try {
    const snapshot = await collection.get();

    if (snapshot.empty) return res.status(404).json({ error: 'No wallet logs found' });

    const logs = snapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => doc.data());
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

// GET /wallet/:account/logs
export const getWalletLogs = async (req: Request, res: Response) => {
  try {
    const { account } = req.params;
    const snapshot = await collection.where('account', '==', account).get();

    if (snapshot.empty) return res.status(404).json({ error: 'No logs for this account' });

    const logs = snapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => doc.data());
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};
