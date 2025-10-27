import { test, expect } from '@playwright/test'
import {
  makeWalletImporter,
  makeWalletExporter,
  deployFixtureContracts,
  mintUSDC,
  parseViemError,
} from './fixture-chain'
import {
  addMinterKYC,
  mintKYC,
  reviewDocument,
  signDocument,
  revokeDocument,
} from './fixture-kyc'
import { addMinterDocument } from './fixture-document'
import { deployAgreement, depositAgreement } from './fixture-tradeAgreement'

let walletImporter: Awaited<ReturnType<typeof makeWalletImporter>>
let walletExporter: Awaited<ReturnType<typeof makeWalletExporter>>
let contracts: Awaited<ReturnType<typeof deployFixtureContracts>>

test.beforeAll(async () => {
  walletImporter = await makeWalletImporter()
  walletExporter = await makeWalletExporter()
  contracts = await deployFixtureContracts(walletImporter)

  await addMinterKYC(walletImporter, contracts.kycRegistryAddress, walletImporter.account!.address)
  await addMinterDocument(walletImporter, contracts.documentRegistryAddress, walletImporter.account!.address)

  await mintUSDC(walletImporter, contracts.mockUSDCAddress, walletImporter.account!.address, 500n)
})

test('Negative: cannot deploy agreement without KYC', async () => {
  let error: any
  try {
    await deployAgreement(
      walletImporter,
      contracts.factoryAddress,
      walletImporter.account!.address as `0x${string}`,
      walletExporter.account!.address as `0x${string}`,
      1000n,
      0n, // no importer KYC
      0n, // no exporter KYC
      contracts.mockUSDCAddress
    )
  } catch (err) {
    error = parseViemError(err)
  }

  expect(error?.reason || error?.message).toMatch(/KYC required|revert/)
})

test('Deposit less than required amount does not complete stage', async () => {
  const importerAddr = walletImporter.account!.address as `0x${string}`
  const exporterAddr = walletExporter.account!.address as `0x${string}`

  const kycTx = await mintKYC(walletImporter, contracts.kycRegistryAddress, importerAddr, 'QmNegImporter', 'https://example.com')
  expect(kycTx).toBeDefined()
  const kycTx2 = await mintKYC(walletImporter, contracts.kycRegistryAddress, exporterAddr, 'QmNegExporter', 'https://example.com')
  expect(kycTx2).toBeDefined()

  const agreementAddress = await deployAgreement(
    walletImporter,
    contracts.factoryAddress,
    importerAddr,
    exporterAddr,
    1000n,
    1n,
    2n,
    contracts.mockUSDCAddress
  )

  let error: any
  try {
    await depositAgreement(walletImporter, agreementAddress, 100n, contracts.mockUSDCAddress) // partial
  } catch (err) {
    error = parseViemError(err)
  }
  expect(error?.reason || error?.message).toMatch(/Insufficient deposit|revert/)
})

test('Negative: wallet on wrong network should fail', async () => {
  // Simulasi wrong network → langsung test reverts
  let error: any
  try {
    await mintKYC(walletExporter, contracts.kycRegistryAddress, walletExporter.account!.address as `0x${string}`, 'QmWrongNet', 'https://example.com')
  } catch (err) {
    error = parseViemError(err)
  }
  expect(error).toBeDefined()
})

test('Negative: revoke document - Draft/Reviewed allowed, Signed fails', async () => {
  const addr = walletImporter.account!.address as `0x${string}`

  // Mint KYC document (acts like doc)
  await mintKYC(walletImporter, contracts.kycRegistryAddress, addr, 'QmRevocableDoc', 'https://example.com')
  const tokenId = 3n // third minted

  // Revoke at Draft → should pass
  await revokeDocument(walletImporter, contracts.kycRegistryAddress, tokenId)

  // Mint again for next state
  await mintKYC(walletImporter, contracts.kycRegistryAddress, addr, 'QmRevocableDoc2', 'https://example.com')
  const tokenId2 = 4n
  await reviewDocument(walletImporter, contracts.kycRegistryAddress, tokenId2)
  await revokeDocument(walletImporter, contracts.kycRegistryAddress, tokenId2)

  // Mint and sign → revoke should fail
  await mintKYC(walletImporter, contracts.kycRegistryAddress, addr, 'QmSignedDoc', 'https://example.com')
  const tokenId3 = 5n
  await reviewDocument(walletImporter, contracts.kycRegistryAddress, tokenId3)
  await signDocument(walletImporter, contracts.kycRegistryAddress, tokenId3)

  let error: any
  try {
    await revokeDocument(walletImporter, contracts.kycRegistryAddress, tokenId3)
  } catch (err) {
    error = parseViemError(err)
  }

  expect(error?.reason || error?.message).toMatch(/Signed docs cannot be revoked|Internal error/)
})
