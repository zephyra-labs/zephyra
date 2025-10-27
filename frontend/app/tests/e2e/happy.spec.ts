import { test, expect } from '@playwright/test'
import {
  makeWalletImporter,
  makeWalletExporter,
  deployFixtureContracts,
  mintUSDC,
} from './fixture-chain'
import {
  addMinterKYC,
  mintKYC,
  getTokenIdByHash,
  getStatus as getKYCStatus,
} from './fixture-kyc'
import {
  mintAndLinkDocument,
  addMinterDocument,
  getStatus as getDocumentStatus,
  reviewDocument,
  signDocument,
} from './fixture-document'
import {
  deployAgreement,
  signAgreement,
  depositAgreement,
  startShipping,
  completeAgreement,
} from './fixture-tradeAgreement'

let walletImporter: Awaited<ReturnType<typeof makeWalletImporter>>
let walletExporter: Awaited<ReturnType<typeof makeWalletExporter>>
let contracts: Awaited<ReturnType<typeof deployFixtureContracts>>

test.beforeAll(async () => {
  walletImporter = await makeWalletImporter()
  walletExporter = await makeWalletExporter()
  contracts = await deployFixtureContracts(walletImporter)

  // Add minter role to both wallets
  await addMinterKYC(walletImporter, contracts.kycRegistryAddress, walletImporter.account!.address)
  await addMinterKYC(walletImporter, contracts.kycRegistryAddress, walletExporter.account!.address)
  await addMinterDocument(walletImporter, contracts.documentRegistryAddress, walletImporter.account!.address)
  await addMinterDocument(walletImporter, contracts.documentRegistryAddress, walletExporter.account!.address)

  await mintUSDC(walletImporter, contracts.mockUSDCAddress, walletImporter.account!.address, 1_000_000n)
})

test('Happy path: full trade agreement flow with KYC lifecycle & document lifecycle', async () => {
  const importerAddress = walletImporter.account!.address as `0x${string}`
  const exporterAddress = walletExporter.account!.address as `0x${string}`

  // --- Mint KYC documents ---
  await mintKYC(walletImporter, contracts.kycRegistryAddress, importerAddress, 'QmImporter123', 'https://example.com/metadata.json')
  await mintKYC(walletExporter, contracts.kycRegistryAddress, exporterAddress, 'QmExporter456', 'https://example.com/metadata.json')

  // --- Check KYC token IDs ---
  const importerKycTokenId = await getTokenIdByHash('QmImporter123', contracts.kycRegistryAddress)
  const exporterKycTokenId = await getTokenIdByHash('QmExporter456', contracts.kycRegistryAddress)
  expect(importerKycTokenId).toBe(1n)
  expect(exporterKycTokenId).toBe(2n)

  // --- Check lifecycle status (KYC is also document-based now) ---
  expect(await getKYCStatus(contracts.kycRegistryAddress, importerKycTokenId)).toBe(0) // Draft
  expect(await getKYCStatus(contracts.kycRegistryAddress, exporterKycTokenId)).toBe(0)

  // --- Review and sign KYC ---
  await reviewDocument(walletImporter, contracts.kycRegistryAddress, importerKycTokenId)
  await signDocument(walletImporter, contracts.kycRegistryAddress, importerKycTokenId)
  await reviewDocument(walletImporter, contracts.kycRegistryAddress, exporterKycTokenId)
  await signDocument(walletImporter, contracts.kycRegistryAddress, exporterKycTokenId)

  expect(await getKYCStatus(contracts.kycRegistryAddress, importerKycTokenId)).toBe(2) // Signed
  expect(await getKYCStatus(contracts.kycRegistryAddress, exporterKycTokenId)).toBe(2)

  // --- Deploy trade agreement ---
  const requiredAmount = 1000n
  const agreementAddress = await deployAgreement(
    walletImporter,
    contracts.factoryAddress,
    importerAddress,
    exporterAddress,
    requiredAmount,
    importerKycTokenId,
    exporterKycTokenId,
    contracts.mockUSDCAddress
  )
  expect(agreementAddress).toMatch(/^0x[a-fA-F0-9]{40}$/)

  // --- Mint & link trade documents ---
  const { tokenId: importerDocId } = await mintAndLinkDocument(
    walletImporter,
    contracts.documentRegistryAddress,
    importerAddress,
    agreementAddress,
    'QmImporterDoc',
    'https://example.com/importerDoc.json',
    'Invoice'
  )
  const { tokenId: exporterDocId } = await mintAndLinkDocument(
    walletExporter,
    contracts.documentRegistryAddress,
    exporterAddress,
    agreementAddress,
    'QmExporterDoc',
    'https://example.com/exporterDoc.json',
    'Invoice'
  )

  expect(importerDocId).toBe(1n)
  expect(exporterDocId).toBe(2n)

  // --- Review documents ---
  await reviewDocument(walletImporter, contracts.documentRegistryAddress, importerDocId)
  await reviewDocument(walletExporter, contracts.documentRegistryAddress, exporterDocId)
  expect(await getDocumentStatus(contracts.documentRegistryAddress, importerDocId)).toBe(1)
  expect(await getDocumentStatus(contracts.documentRegistryAddress, exporterDocId)).toBe(1)

  // --- Sign documents ---
  await signDocument(walletImporter, contracts.documentRegistryAddress, importerDocId)
  await signDocument(walletExporter, contracts.documentRegistryAddress, exporterDocId)
  expect(await getDocumentStatus(contracts.documentRegistryAddress, importerDocId)).toBe(2)
  expect(await getDocumentStatus(contracts.documentRegistryAddress, exporterDocId)).toBe(2)

  // --- Both parties sign agreement ---
  await signAgreement(walletImporter, agreementAddress)
  await signAgreement(walletExporter, agreementAddress)

  // --- Deposit by importer ---
  await depositAgreement(walletImporter, agreementAddress, 1000n, contracts.mockUSDCAddress)

  // --- Start shipping & complete agreement ---
  await startShipping(walletExporter, agreementAddress)
  await completeAgreement(walletImporter, agreementAddress)
})
