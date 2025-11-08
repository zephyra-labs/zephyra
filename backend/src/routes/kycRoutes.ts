/**
 * @file kycRoutes.ts
 * @description Express router for KYC with Swagger/OpenAPI 3.0 documentation
 */

import express, { Router } from "express";
import {
  createKYC,
  getAllKYCs,
  getKYCById,
  getKYCsByOwner,
  updateKYC,
  deleteKYC,
  getKYCLogs,
  updateKYCInternal,
} from "../controllers/kycController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { internalAuthMiddleware } from "../middlewares/internalAuthMiddleware";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     KYCDTO:
 *       type: object
 *       required:
 *         - tokenId
 *         - owner
 *         - fileHash
 *         - metadataUrl
 *       properties:
 *         tokenId:
 *           type: string
 *           example: "kyc-uuid-123"
 *         owner:
 *           type: string
 *           example: "0x123abc..."
 *         fileHash:
 *           type: string
 *           example: "Qmabcdef..."
 *         metadataUrl:
 *           type: string
 *           example: "https://ipfs.io/ipfs/Qmabcdef..."
 *         documentUrl:
 *           type: string
 *           example: "https://storage.example.com/docs/kyc-123.pdf"
 *         name:
 *           type: string
 *           example: "NFT-123"
 *         description:
 *           type: string
 *           example: "KYC for user 0x123abc..."
 *         txHash:
 *           type: string
 *           example: "0xabc123..."
 *         createdAt:
 *           type: integer
 *           example: 1699286400000
 *         updatedAt:
 *           type: integer
 *           example: 1699372800000
 *         status:
 *           type: string
 *           enum: ["Draft", "Reviewed", "Signed", "Revoked"]
 *           example: "Pending"
 *
 * tags:
 *   - name: KYC
 *     description: Endpoints to manage KYC records
 */

/**
 * @swagger
 * /api/kyc/internal/{tokenId}/status:
 *   patch:
 *     tags: [KYC]
 *     summary: Internal update of KYC status
 *     security:
 *       - internalBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         schema:
 *           type: string
 *         required: true
 *         description: KYC token ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: ["Draft", "Reviewed", "Signed", "Revoked"]
 *                 example: "Approved"
 *     responses:
 *       200:
 *         description: Updated KYC record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/KYCDTO'
 */
router.patch("/internal/:tokenId/status", internalAuthMiddleware, express.json(), updateKYCInternal);

/**
 * @swagger
 * /api/kyc:
 *   post:
 *     tags: [KYC]
 *     summary: Create a new KYC record
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               owner:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
 *               fileHash:
 *                 type: string
 *               metadataUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created KYC record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/KYCDTO'
 */
router.post("/", authMiddleware, createKYC);

/**
 * @swagger
 * /api/kyc/{tokenId}:
 *   patch:
 *     tags: [KYC]
 *     summary: Update an existing KYC record
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         schema:
 *           type: string
 *         required: true
 *         description: KYC token ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/KYCDTO'
 *     responses:
 *       200:
 *         description: Updated KYC record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/KYCDTO'
 */
router.patch("/:tokenId", authMiddleware, express.json(), updateKYC);

/**
 * @swagger
 * /api/kyc/{tokenId}:
 *   delete:
 *     tags: [KYC]
 *     summary: Delete a KYC record
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         schema:
 *           type: string
 *         required: true
 *         description: KYC token ID
 *     responses:
 *       200:
 *         description: Success message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "KYC deleted"
 */
router.delete("/:tokenId", authMiddleware, express.json(), deleteKYC);

/**
 * @swagger
 * /api/kyc:
 *   get:
 *     tags: [KYC]
 *     summary: Get all KYC records
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all KYC records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/KYCDTO'
 */
router.get("/", authMiddleware, getAllKYCs);

/**
 * @swagger
 * /api/kyc/{tokenId}:
 *   get:
 *     tags: [KYC]
 *     summary: Get KYC record by token ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         schema:
 *           type: string
 *         required: true
 *         description: KYC token ID
 *     responses:
 *       200:
 *         description: KYC record
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/KYCDTO'
 */
router.get("/:tokenId", authMiddleware, getKYCById);

/**
 * @swagger
 * /api/kyc/owner/{owner}:
 *   get:
 *     tags: [KYC]
 *     summary: Get all KYC records for a specific owner
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: owner
 *         schema:
 *           type: string
 *         required: true
 *         description: Owner wallet address
 *     responses:
 *       200:
 *         description: List of KYC records for owner
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/KYCDTO'
 */
router.get("/owner/:owner", authMiddleware, getKYCsByOwner);

/**
 * @swagger
 * /api/kyc/{tokenId}/logs:
 *   get:
 *     tags: [KYC]
 *     summary: Get KYC activity logs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         schema:
 *           type: string
 *         required: true
 *         description: KYC token ID
 *     responses:
 *       200:
 *         description: List of KYC logs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get("/:tokenId/logs", authMiddleware, getKYCLogs);

export default router;
