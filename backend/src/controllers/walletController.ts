/**
 * @file walletController.ts
 * @description Controller for wallet activities: login, disconnect, fetch logs, wallet state management.
 */

import type { Request, Response } from 'express';
import * as WalletService from '../services/walletService.js';
import { WalletAction } from '../types/Wallet.js';
import { CreateWalletLogDTO, UpdateWalletStateDTO } from '../dtos/walletDTO.js';
import { success, failure, handleError } from '../utils/responseHelper.js';

/**
 * POST /wallet/log-login
 * Record a wallet login event for a user
 *
 * @param {Request} req - Express request object
 * @param {Object} req.body - Payload
 * @param {string} req.body.account - Wallet account address
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} HTTP response with the created wallet log
 * @throws {Error} If validation fails or service throws
 */
export const logWalletLogin = async (req: Request, res: Response) => {
  try {
    const dto = new CreateWalletLogDTO(req.body);
    dto.action = WalletAction.CONNECT;
    dto.validate();

    const result = await WalletService.recordWalletActivity(dto);
    return success(res, result, 201);
  } catch (err) {
    return handleError(res, err, 'Failed to log wallet login');
  }
};

/**
 * POST /wallet/log-disconnect
 * Record a wallet disconnect event for a user
 *
 * @param {Request} req - Express request object
 * @param {Object} req.body - Payload
 * @param {string} req.body.account - Wallet account address
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} HTTP response with the created wallet log
 * @throws {Error} If validation fails or service throws
 */
export const logWalletDisconnect = async (req: Request, res: Response) => {
  try {
    const dto = new CreateWalletLogDTO(req.body);
    dto.action = WalletAction.DISCONNECT;
    dto.validate();

    const result = await WalletService.recordWalletActivity(dto);
    return success(res, result, 201);
  } catch (err) {
    return handleError(res, err, 'Failed to log wallet disconnect');
  }
};

/**
 * GET /wallet/logs
 * Retrieve all wallet logs
 *
 * @param {Request} _req - Express request object (unused)
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} HTTP response with list of all wallet logs
 * @throws {Error} If service throws
 */
export const getAllWalletLogs = async (_req: Request, res: Response) => {
  try {
    const logs = await WalletService.fetchAllWalletLogs();
    return success(res, logs);
  } catch (err) {
    return handleError(res, err, 'Failed to fetch wallet logs');
  }
};

/**
 * GET /wallet/:account/logs
 * Retrieve wallet logs for a specific account
 *
 * @param {Request} req - Express request object
 * @param {string} req.params.account - Wallet account address
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} HTTP response with wallet logs for the account
 * @throws {Error} If account param is missing or service throws
 */
export const getWalletLogs = async (req: Request, res: Response) => {
  try {
    const { account } = req.params;
    if (!account) return failure(res, 'Account parameter is required');

    const logs = await WalletService.fetchWalletLogsByAccount(account);
    return success(res, logs);
  } catch (err) {
    return handleError(res, err, 'Failed to fetch wallet logs for account');
  }
};

/**
 * GET /wallet/:account/state
 * Retrieve current wallet state for a specific account
 *
 * @param {Request} req - Express request object
 * @param {string} req.params.account - Wallet account address
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} HTTP response with wallet state
 * @throws {Error} If account param is missing, wallet not found, or service throws
 */
export const getWalletState = async (req: Request, res: Response) => {
  try {
    const { account } = req.params;
    if (!account) return failure(res, 'Account parameter is required');

    const state = await WalletService.fetchWalletState(account);
    if (!state) return failure(res, 'Wallet state not found', 404);

    return success(res, state);
  } catch (err) {
    return handleError(res, err, 'Failed to fetch wallet state');
  }
};

/**
 * PATCH /wallet/:account/state
 * Update wallet state for a specific account
 *
 * @param {Request} req - Express request object
 * @param {string} req.params.account - Wallet account address
 * @param {Object} req.body - Partial wallet state to update
 * @param {number} [req.body.chainId] - Optional chain ID
 * @param {string} [req.body.provider] - Optional wallet provider
 * @param {string} [req.body.sessionId] - Optional session ID
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} HTTP response indicating success
 * @throws {Error} If account param is missing or validation/service fails
 */
export const updateWalletStateController = async (req: Request, res: Response) => {
  try {
    const { account } = req.params;
    if (!account) return failure(res, 'Account parameter is required');

    const dto = new UpdateWalletStateDTO({ ...req.body, account });
    dto.validate();

    await WalletService.updateWalletState(dto);
    return success(res, { message: 'Wallet state updated' });
  } catch (err) {
    return handleError(res, err, 'Failed to update wallet state');
  }
};

/**
 * DELETE /wallet/:account
 * Purge all wallet data (logs + state) for a specific account
 *
 * @param {Request} req - Express request object
 * @param {string} req.params.account - Wallet account address
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} HTTP response indicating success
 * @throws {Error} If account param is missing or service fails
 */
export const deleteWalletController = async (req: Request, res: Response) => {
  try {
    const { account } = req.params;
    if (!account) return failure(res, 'Account parameter is required');

    await WalletService.purgeWalletData(account);
    return success(res, { message: 'Wallet data deleted' });
  } catch (err) {
    return handleError(res, err, 'Failed to delete wallet data');
  }
};
