/**
 * @file walletModel.ts
 * @description Data access layer for wallet logs and wallet state in Firestore.
 */

import { db } from '../config/firebase.js';
import { CreateWalletLogDTO, UpdateWalletStateDTO } from '../dtos/walletDTO.js';
import type { WalletLog, WalletState } from '../types/Wallet.js';

const walletLogsCollection = db.collection('walletLogs');
const walletStateCollection = db.collection('walletStates');

/**
 * Creates a new wallet log entry in Firestore.
 * @param {Partial<CreateWalletLogDTO>} data - Partial DTO containing wallet log information.
 * @returns {Promise<string>} The ID of the created Firestore document.
 * @throws {Error} If validation fails or Firestore operation fails.
 */
export const createWalletLog = async (data: Partial<CreateWalletLogDTO>): Promise<string> => {
  const dto = new CreateWalletLogDTO(data);
  dto.validate();

  const logData = dto.toLog();
  const docRef = await walletLogsCollection.add(logData);

  return docRef.id;
};

/**
 * Retrieves all wallet logs.
 * @returns {Promise<WalletLog[]>} A list of all wallet log entries.
 */
export const getAllWalletLogs = async (): Promise<WalletLog[]> => {
  const snapshot = await walletLogsCollection.orderBy('timestamp', 'desc').get();
  return snapshot.docs.map((doc) => doc.data() as WalletLog);
};

/**
 * Retrieves all wallet logs for a specific account.
 * @param {string} account - The wallet address or account identifier.
 * @returns {Promise<WalletLog[]>} A list of wallet logs for the specified account.
 */
export const getWalletLogsByAccount = async (account: string): Promise<WalletLog[]> => {
  const snapshot = await walletLogsCollection
    .where('account', '==', account)
    .orderBy('timestamp', 'desc')
    .get();

  return snapshot.docs.map((doc) => doc.data() as WalletLog);
};

/**
 * Saves or updates a wallet state document in Firestore.
 * If the document exists, merges updates; otherwise, creates a new record.
 * @param {Partial<UpdateWalletStateDTO>} data - Partial wallet state update payload.
 * @returns {Promise<void>} Resolves when the update is complete.
 */
export const upsertWalletState = async (data: Partial<UpdateWalletStateDTO>): Promise<void> => {
  const dto = new UpdateWalletStateDTO(data);
  dto.validate();

  const state = dto.toState();
  await walletStateCollection.doc(state.account).set(state, { merge: true });
};

/**
 * Retrieves the current wallet state for a given account.
 * @param {string} account - The wallet address or user identifier.
 * @returns {Promise<WalletState | null>} The current wallet state, or null if not found.
 */
export const getWalletState = async (account: string): Promise<WalletState | null> => {
  const doc = await walletStateCollection.doc(account).get();
  return doc.exists ? (doc.data() as WalletState) : null;
};

/**
 * Deletes all wallet logs and state for a given account.
 * @param {string} account - The wallet address or identifier.
 * @returns {Promise<void>} Resolves when deletion is complete.
 */
export const deleteWalletData = async (account: string): Promise<void> => {
  const logs = await walletLogsCollection.where('account', '==', account).get();
  const batch = db.batch();

  logs.docs.forEach((doc) => batch.delete(doc.ref));
  batch.delete(walletStateCollection.doc(account));

  await batch.commit();
};
