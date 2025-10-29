import { Request, Response } from 'express'
import admin from 'firebase-admin'
import WalletLogDTO from '../dtos/walletDTO.js'
import { createWalletLog } from '../models/walletModel.js'
import { db } from '../config/firebase.js'
import { success, failure, handleError } from '../utils/responseHelper.js'

const collection = db.collection('walletLogs')

// --- POST /wallet/log-login ---
export const logWalletLogin = async (req: Request, res: Response) => {
  try {
    const { account } = req.body
    if (!account) return failure(res, 'Missing account', 400)

    const dto = new WalletLogDTO({ account, action: 'connect' })
    dto.validate()

    await createWalletLog(dto)
    return success(res, dto.toJSON(), 201)
  } catch (err) {
    return handleError(res, err, 'Failed to log wallet login')
  }
}

// --- POST /wallet/log-disconnect ---
export const logWalletDisconnect = async (req: Request, res: Response) => {
  try {
    const { account } = req.body
    if (!account) return failure(res, 'Missing account', 400)

    const dto = new WalletLogDTO({ account, action: 'disconnect' })
    dto.validate()

    await createWalletLog(dto)

    // --- Hapus cookie ---
    res.setHeader(
      'Set-Cookie',
      'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure'
    )

    return success(res, dto.toJSON(), 201)
  } catch (err) {
    return handleError(res, err, 'Failed to log wallet disconnect')
  }
}

// --- GET /wallet/logs ---
export const getAllWalletLogs = async (_req: Request, res: Response) => {
  try {
    const snapshot = await collection.get()
    if (snapshot.empty) return failure(res, 'No wallet logs found', 404)

    const logs = snapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => doc.data())
    return success(res, logs)
  } catch (err) {
    return handleError(res, err, 'Failed to fetch wallet logs')
  }
}

// --- GET /wallet/:account/logs ---
export const getWalletLogs = async (req: Request, res: Response) => {
  try {
    const { account } = req.params
    const snapshot = await collection.where('account', '==', account).get()
    if (snapshot.empty) return failure(res, 'No logs for this account', 404)

    const logs = snapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => doc.data())
    return success(res, logs)
  } catch (err) {
    return handleError(res, err, 'Failed to fetch wallet logs for account')
  }
}
