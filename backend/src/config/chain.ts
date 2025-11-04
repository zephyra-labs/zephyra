/**
 * @file chain.ts
 * @description Configuration object for blockchain network (Hardhat local testnet).
 */

/**
 * @constant {object} Chain
 * @property {number} id - Chain ID (31337 for local Hardhat network)
 * @property {string} name - Human-readable name of the chain
 * @property {object} nativeCurrency - Native currency details
 * @property {string} nativeCurrency.name - Name of the currency
 * @property {string} nativeCurrency.symbol - Symbol of the currency
 * @property {number} nativeCurrency.decimals - Number of decimals
 * @property {object} rpcUrls - RPC endpoints for the network
 * @property {object} rpcUrls.default - Default RPC configuration
 * @property {string[]} rpcUrls.default.http - HTTP RPC URLs
 * @property {boolean} testnet - Indicates if this is a testnet/localnet
 */
export const Chain = {
  id: 31337,
  name: 'Hardhat Local',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['http://127.0.0.1:8545'] } },
  testnet: true,
}
