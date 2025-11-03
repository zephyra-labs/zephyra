/**
 * @file walletService.ts
 * @description Business logic for wallet logs and wallet state management.
 */

import {
  createWalletLog,
  getAllWalletLogs,
  getWalletLogsByAccount,
  upsertWalletState,
  getWalletState,
  deleteWalletData,
} from '../models/walletModel';

import { CreateWalletLogDTO, UpdateWalletStateDTO } from '../dtos/walletDTO';
import type { WalletLog, WalletState } from '../types/Wallet';

/**
 * Records a wallet connection, disconnection, or other action event.
 * Automatically updates the user's wallet state when relevant.
 * 
 * @param {Partial<CreateWalletLogDTO>} data - Wallet action data (e.g., account, action, meta)
 * @returns {Promise<{ logId: string; state?: WalletState }>} The created log ID and updated state (if applicable)
 * @throws {Error} If the action or data is invalid
 */
export const recordWalletActivity = async (
  data: Partial<CreateWalletLogDTO>
): Promise<{ logId: string; state?: WalletState }> => {
  const logId = await createWalletLog(data);

  // Optional: update wallet state if action affects session
  if (data.account && data.action) {
    const meta = data.meta ?? {};
    const stateDTO = new UpdateWalletStateDTO({
      account: data.account,
      chainId: typeof meta.chainId === "number" ? meta.chainId : undefined,
      provider: typeof meta.provider === "string" ? meta.provider : undefined,
      sessionId: typeof meta.sessionId === "string" ? meta.sessionId : undefined,
    });

    stateDTO.validate();
    const state = stateDTO.toState();
    await upsertWalletState(state);
    return { logId, state };
  }

  return { logId };
};

/**
 * Retrieves all wallet logs from the system.
 * @returns {Promise<WalletLog[]>} All recorded wallet logs, ordered by timestamp.
 */
export const fetchAllWalletLogs = async (): Promise<WalletLog[]> => {
  return await getAllWalletLogs();
};

/**
 * Retrieves all wallet logs for a specific user account.
 * @param {string} account - Wallet address to filter by.
 * @returns {Promise<WalletLog[]>} Wallet logs related to the specified account.
 */
export const fetchWalletLogsByAccount = async (account: string): Promise<WalletLog[]> => {
  return await getWalletLogsByAccount(account);
};

/**
 * Retrieves the current wallet state for a given user account.
 * @param {string} account - Wallet address.
 * @returns {Promise<WalletState | null>} Wallet state object or null if not found.
 */
export const fetchWalletState = async (account: string): Promise<WalletState | null> => {
  return await getWalletState(account);
};

/**
 * Updates or merges the wallet state for a given user account.
 * Usually triggered when the wallet reconnects, switches network, or signs a message.
 * 
 * @param {Partial<UpdateWalletStateDTO>} data - Wallet state update payload.
 * @returns {Promise<void>} Resolves when the update is saved.
 */
export const updateWalletState = async (data: Partial<UpdateWalletStateDTO>): Promise<void> => {
  const dto = new UpdateWalletStateDTO(data);
  dto.validate();
  await upsertWalletState(dto);
};

/**
 * Deletes all wallet-related data for a given account.
 * Includes wallet logs and wallet state documents.
 * 
 * @param {string} account - Wallet address to delete.
 * @returns {Promise<void>} Resolves when data is fully deleted.
 */
export const purgeWalletData = async (account: string): Promise<void> => {
  await deleteWalletData(account);
};
