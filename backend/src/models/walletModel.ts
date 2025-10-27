import WalletLogDTO from '../dtos/walletDTO.js';
import { db } from '../config/firebase.js'

const collection = db.collection('walletLogs');

export const createWalletLog = async (data: Partial<WalletLogDTO>) => {
  const dto = new WalletLogDTO(data);
  dto.validate();
  await collection.add(dto.toJSON());
};
