import { createWalletClient, createPublicClient, http, type Chain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

export const localChain: Chain = {
  id: 31337,
  name: 'Hardhat Local',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['http://127.0.0.1:8545'] } },
  testnet: true,
};

export const createClients = (importerPK: string, exporterPK: string) => {
  const importerClient = createWalletClient({
    chain: localChain,
    transport: http(localChain.rpcUrls.default.http[0]),
    account: privateKeyToAccount(importerPK as `0x${string}`),
  });

  const exporterClient = createWalletClient({
    chain: localChain,
    transport: http(localChain.rpcUrls.default.http[0]),
    account: privateKeyToAccount(exporterPK as `0x${string}`),
  });

  const publicClient = createPublicClient({
    chain: localChain,
    transport: http(localChain.rpcUrls.default.http[0]),
  });

  return { importerClient, exporterClient, publicClient };
};
