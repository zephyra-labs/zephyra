import type { Request, Response } from 'express';
import { addActivityLog, getAllActivities, getActivityByAccount } from '../models/activityModel.js';

/**
 * POST /activity
 */
export const createActivity = async (req: Request, res: Response) => {
  try {
    const entry = await addActivityLog(req.body);
    res.status(201).json({ success: true, data: entry });
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * GET /activity
 * Optional query: ?account=0x123&txHash=0xabc&limit=20&startAfterTimestamp=1670000000000
 */
export const getActivities = async (req: Request, res: Response) => {
  try {
    const { account, txHash, limit, startAfterTimestamp } = req.query as {
      account?: string;
      txHash?: string;
      limit?: string;
      startAfterTimestamp?: string;
    };

    const logs = await getAllActivities({
      account,
      txHash,
      limit: limit ? parseInt(limit) : undefined,
      startAfterTimestamp: startAfterTimestamp ? parseInt(startAfterTimestamp) : undefined,
    });

    res.json({ success: true, data: logs });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /activity/:account
 * Optional query: ?limit=20&startAfterTimestamp=1670000000000
 */
export const getActivityByAccountController = async (req: Request, res: Response) => {
  try {
    const { account } = req.params;
    const { limit, startAfterTimestamp } = req.query as {
      limit?: string;
      startAfterTimestamp?: string;
    };

    const logs = await getActivityByAccount(account, {
      limit: limit ? parseInt(limit) : undefined,
      startAfterTimestamp: startAfterTimestamp ? parseInt(startAfterTimestamp) : undefined,
    });

    if (!logs || logs.length === 0)
      return res.status(404).json({ success: false, message: 'No logs found for this account' });

    res.json({ success: true, data: logs });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
