/**
 * @file documentRoutes.ts
 * @description Express router for Document management with Swagger/OpenAPI 3.0
 */

import { Router } from "express";
import {
  attachDocument,
  getDocument,
  getDocumentsByOwner,
  getDocumentsByContract,
  getDocumentLogs,
  updateDocument,
  deleteDocument,
  getAllDocuments,
} from "../controllers/documentController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "An error occurred"
 *     DocumentDTO:
 *       type: object
 *       required:
 *         - tokenId
 *         - owner
 *         - fileHash
 *         - uri
 *         - docType
 *       properties:
 *         tokenId:
 *           type: integer
 *           example: 123
 *         owner:
 *           type: string
 *           example: "0x123abc..."
 *         fileHash:
 *           type: string
 *           example: "Qmabcdef..."
 *         uri:
 *           type: string
 *           example: "https://storage.example.com/docs/doc-123.pdf"
 *         docType:
 *           type: string
 *           enum: ["Invoice","B/L","COO","PackingList","Other"]
 *           example: "Invoice"
 *         linkedContracts:
 *           type: array
 *           items:
 *             type: string
 *           example: ["0xcontract1", "0xcontract2"]
 *         status:
 *           type: string
 *           enum: ["Draft", "Reviewed", "Signed", "Revoked"]
 *           example: "Draft"
 *         signer:
 *           type: string
 *           example: "0xsigner..."
 *         createdAt:
 *           type: integer
 *           example: 1699286400000
 *         updatedAt:
 *           type: integer
 *           example: 1699372800000
 *         name:
 *           type: string
 *           example: "Invoice #123"
 *         description:
 *           type: string
 *           example: "Invoice for trade #456"
 *         metadataUrl:
 *           type: string
 *           example: "https://metadata.example.com/doc-123.json"
 *
 * tags:
 *   - name: Document
 *     description: Endpoints to manage trade-related documents
 */

/**
 * @swagger
 * /api/document/contract/{addr}/docs:
 *   post:
 *     tags: [Document]
 *     summary: Attach a new document to a contract
 *     description: >
 *       Create and attach a new trade-related document to a specific contract.  
 *       Required fields: **tokenId, owner, fileHash, uri, docType, action, signer**
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: addr
 *         required: true
 *         schema:
 *           type: string
 *         description: Contract address to attach the document to
 *         example: "0xContractAddress1"
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DocumentDTO'
 *           examples:
 *             newDocument:
 *               summary: Example document attachment request
 *               value:
 *                 tokenId: 123
 *                 owner: "0xOwner1"
 *                 fileHash: "Qmabcdef..."
 *                 uri: "https://storage.example.com/docs/doc-123.pdf"
 *                 docType: "Invoice"
 *                 signer: "0xSigner1"
 *                 name: "Invoice #123"
 *                 description: "Invoice for trade #456"
 *                 metadataUrl: "https://metadata.example.com/doc-123.json"
 *                 action: "uploaded"
 *                 txHash: "0xTxHash1"
 *
 *     responses:
 *       201:
 *         description: Document successfully created and attached to the contract
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentDTO'
 *             examples:
 *               created:
 *                 summary: Example created document
 *                 value:
 *                   tokenId: 123
 *                   owner: "0xOwner1"
 *                   fileHash: "Qmabcdef..."
 *                   uri: "https://storage.example.com/docs/doc-123.pdf"
 *                   docType: "Invoice"
 *                   linkedContracts: ["0xContractAddress1"]
 *                   signer: "0xSigner1"
 *                   status: "Draft"
 *                   name: "Invoice #123"
 *                   description: "Invoice for trade #456"
 *                   metadataUrl: "https://metadata.example.com/doc-123.json"
 *                   createdAt: 1700000000000
 *                   updatedAt: 1700000000000
 *
 *       400:
 *         description: Bad Request — malformed JSON or invalid payload structure
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *             example:
 *               success: false
 *               message: "Invalid request body format"
 *
 *       401:
 *         description: Unauthorized — missing or invalid bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *             example:
 *               success: false
 *               message: "Missing or invalid Authorization header"
 *
 *       422:
 *         description: Unprocessable Entity — missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *             examples:
 *               missingField:
 *                 summary: Example validation error
 *                 value:
 *                   success: false
 *                   message: "Missing required field: tokenId"
 *
 *       404:
 *         description: Contract not found (if service layer checks this)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *             example:
 *               success: false
 *               message: "Contract not found"
 *
 *       500:
 *         description: Server error while attaching document
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *             example:
 *               success: false
 *               message: "Failed to attach document"
 */
router.post("/contract/:addr/docs", authMiddleware, attachDocument);

/**
 * @swagger
 * /api/document:
 *   get:
 *     tags: [Document]
 *     summary: Get all documents
 *     description: Retrieve a list of all trade-related documents in the system.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all documents
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DocumentDTO'
 *             examples:
 *               success:
 *                 summary: Example list of documents
 *                 value:
 *                   - tokenId: 123
 *                     owner: "0xOwner1"
 *                     fileHash: "Qmabcdef..."
 *                     uri: "https://storage.example.com/docs/doc-123.pdf"
 *                     docType: "Invoice"
 *                     linkedContracts: ["0xContractAddress1"]
 *                     status: "Draft"
 *                     signer: "0xSigner1"
 *                     name: "Invoice #123"
 *                     description: "Invoice for trade #456"
 *                     metadataUrl: "https://metadata.example.com/doc-123.json"
 *                     createdAt: 1700000000000
 *                     updatedAt: 1700003600000
 *                   - tokenId: 124
 *                     owner: "0xOwner2"
 *                     fileHash: "Qmghijkl..."
 *                     uri: "https://storage.example.com/docs/doc-124.pdf"
 *                     docType: "B/L"
 *                     linkedContracts: ["0xContractAddress2"]
 *                     status: "Reviewed"
 *                     signer: "0xSigner2"
 *                     name: "B/L #124"
 *                     description: "Bill of Lading for trade #457"
 *                     metadataUrl: "https://metadata.example.com/doc-124.json"
 *                     createdAt: 1700007200000
 *                     updatedAt: 1700010800000
 *
 *       401:
 *         description: Unauthorized — missing or invalid bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing or invalid Authorization header"
 *
 *       500:
 *         description: Server error while fetching documents
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to fetch documents"
 */
router.get("/", authMiddleware, getAllDocuments);

/**
 * @swagger
 * /api/document/owner/{owner}:
 *   get:
 *     tags: [Document]
 *     summary: Get all documents for a specific owner
 *     description: >
 *       Retrieve all trade-related documents belonging to a specific wallet address (owner).  
 *       The owner address must be a valid non-empty string.
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: owner
 *         required: true
 *         schema:
 *           type: string
 *         description: Wallet address that owns the documents
 *         example: "0xOwner1"
 *
 *     responses:
 *       200:
 *         description: List of documents belonging to the specified owner
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DocumentDTO'
 *             examples:
 *               success:
 *                 summary: Example list of owner documents
 *                 value:
 *                   - tokenId: 123
 *                     owner: "0xOwner1"
 *                     fileHash: "Qmabcdef..."
 *                     uri: "https://storage.example.com/docs/doc-123.pdf"
 *                     docType: "Invoice"
 *                     linkedContracts: ["0xContractAddress1"]
 *                     status: "Draft"
 *                     signer: "0xSigner1"
 *                     name: "Invoice #123"
 *                     description: "Invoice for trade #456"
 *                     metadataUrl: "https://metadata.example.com/doc-123.json"
 *                     createdAt: 1700000000000
 *                     updatedAt: 1700003600000
 *                   - tokenId: 125
 *                     owner: "0xOwner1"
 *                     fileHash: "Qmxyz123..."
 *                     uri: "https://storage.example.com/docs/doc-125.pdf"
 *                     docType: "PackingList"
 *                     linkedContracts: ["0xContractAddress3"]
 *                     status: "Signed"
 *                     signer: "0xSigner3"
 *                     name: "Packing List #125"
 *                     description: "Packing list for trade #458"
 *                     metadataUrl: "https://metadata.example.com/doc-125.json"
 *                     createdAt: 1700014400000
 *                     updatedAt: 1700018000000
 *
 *       400:
 *         description: Bad Request — invalid format or malformed owner parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Invalid owner address format"
 *
 *       401:
 *         description: Unauthorized — missing or invalid bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing or invalid Authorization header"
 *
 *       422:
 *         description: Unprocessable Entity — missing owner parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingOwner:
 *                 summary: Missing required owner parameter
 *                 value:
 *                   success: false
 *                   message: "Missing owner parameter"
 *
 *       404:
 *         description: No documents found for this owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "No documents found for the specified owner"
 *
 *       500:
 *         description: Server error while fetching documents by owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to fetch documents by owner"
 */
router.get("/owner/:owner", authMiddleware, getDocumentsByOwner);

/**
 * @swagger
 * /api/document/contract/{addr}:
 *   get:
 *     tags: [Document]
 *     summary: Get all documents linked to a contract
 *     description: >
 *       Retrieve all trade-related documents associated with a specific contract address.  
 *       The contract address must be a valid non-empty string.
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: addr
 *         required: true
 *         schema:
 *           type: string
 *         description: Contract address to fetch linked documents
 *         example: "0xContractAddress1"
 *
 *     responses:
 *       200:
 *         description: List of documents linked to the specified contract
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DocumentDTO'
 *             examples:
 *               success:
 *                 summary: Example documents for a contract
 *                 value:
 *                   - tokenId: 123
 *                     owner: "0xOwner1"
 *                     fileHash: "Qmabcdef..."
 *                     uri: "https://storage.example.com/docs/doc-123.pdf"
 *                     docType: "Invoice"
 *                     linkedContracts: ["0xContractAddress1"]
 *                     status: "Draft"
 *                     signer: "0xSigner1"
 *                     name: "Invoice #123"
 *                     description: "Invoice for trade #456"
 *                     metadataUrl: "https://metadata.example.com/doc-123.json"
 *                     createdAt: 1700000000000
 *                     updatedAt: 1700003600000
 *                   - tokenId: 124
 *                     owner: "0xOwner2"
 *                     fileHash: "Qmghijkl..."
 *                     uri: "https://storage.example.com/docs/doc-124.pdf"
 *                     docType: "B/L"
 *                     linkedContracts: ["0xContractAddress1"]
 *                     status: "Reviewed"
 *                     signer: "0xSigner2"
 *                     name: "B/L #124"
 *                     description: "Bill of Lading for trade #457"
 *                     metadataUrl: "https://metadata.example.com/doc-124.json"
 *                     createdAt: 1700007200000
 *                     updatedAt: 1700010800000
 *
 *       400:
 *         description: Bad Request — invalid or malformed contract address
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Invalid contract address format"
 *
 *       401:
 *         description: Unauthorized — missing or invalid bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing or invalid Authorization header"
 *
 *       422:
 *         description: Unprocessable Entity — contract address missing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingAddr:
 *                 summary: Missing contract address
 *                 value:
 *                   success: false
 *                   message: "Missing contract address"
 *
 *       404:
 *         description: No documents found for the given contract address
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "No documents found for this contract"
 *
 *       500:
 *         description: Server error while fetching documents by contract
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to fetch documents by contract"
 */
router.get("/contract/:addr", authMiddleware, getDocumentsByContract);

/**
 * @swagger
 * /api/document/{tokenId}:
 *   get:
 *     tags: [Document]
 *     summary: Get a document by token ID
 *     description: Retrieve details of a specific trade-related document using its token ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Document token ID
 *         example: 123
 *     responses:
 *       200:
 *         description: Document details successfully fetched
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentDTO'
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   data:
 *                     tokenId: 123
 *                     owner: "0xOwner1"
 *                     fileHash: "Qmabcdef..."
 *                     uri: "https://storage.example.com/docs/doc-123.pdf"
 *                     docType: "Invoice"
 *                     linkedContracts: ["0xContractAddress1"]
 *                     status: "Draft"
 *                     signer: "0xSigner1"
 *                     name: "Invoice #123"
 *                     description: "Invoice for trade #456"
 *                     metadataUrl: "https://metadata.example.com/doc-123.json"
 *                     createdAt: 1700000000000
 *                     updatedAt: 1700003600000
 *
 *       400:
 *         description: Bad Request — malformed path parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Bad request"
 *
 *       401:
 *         description: Unauthorized — missing or invalid bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing or invalid Authorization header"
 *
 *       404:
 *         description: Document not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Document not found"
 *
 *       422:
 *         description: Unprocessable Entity — invalid tokenId format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Invalid tokenId format"
 *
 *       500:
 *         description: Server error while fetching document
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to fetch document"
 */
router.get("/:tokenId", authMiddleware, getDocument);

/**
 * @swagger
 * /api/document/{tokenId}/logs:
 *   get:
 *     tags: [Document]
 *     summary: Get activity logs for a document
 *     description: Retrieve the history of actions performed on a specific document by token ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Document token ID
 *         example: 123
 *     responses:
 *       200:
 *         description: Document logs successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       action:
 *                         type: string
 *                         example: "Created"
 *                       account:
 *                         type: string
 *                         example: "0xSigner1"
 *                       timestamp:
 *                         type: integer
 *                         example: 1700000000000
 *                       txHash:
 *                         type: string
 *                         example: "0xTransactionHash1"
 *
 *       400:
 *         description: Bad request — malformed request input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Bad request"
 *
 *       401:
 *         description: Unauthorized — missing or invalid bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing or invalid Authorization header"
 *
 *       404:
 *         description: Document or logs not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               documentNotFound:
 *                 summary: Document not found
 *                 value:
 *                   success: false
 *                   message: "Document not found"
 *               noLogsFound:
 *                 summary: No logs available for this document
 *                 value:
 *                   success: false
 *                   message: "No logs found"
 *
 *       422:
 *         description: Unprocessable Entity — invalid tokenId format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Invalid tokenId format"
 *
 *       500:
 *         description: Server error while fetching document logs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to fetch document logs"
 */
router.get("/:tokenId/logs", authMiddleware, getDocumentLogs);

/**
 * @swagger
 * /api/document/{tokenId}:
 *   patch:
 *     tags: [Document]
 *     summary: Update a document
 *     description: Update fields of a document identified by token ID. Requires `action` and `account` fields for logging and audit history.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Document token ID
 *         example: 123
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               owner:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               docType:
 *                 type: string
 *               action:
 *                 type: string
 *               account:
 *                 type: string
 *               txHash:
 *                 type: string
 *           example:
 *             owner: "0x123abc..."
 *             name: "Invoice #123 Updated"
 *             description: "Updated invoice description"
 *             docType: "Invoice"
 *             action: "Updated"
 *             account: "0xSigner1"
 *             txHash: "0xTransactionHash1"
 *     responses:
 *       200:
 *         description: Updated document returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/DocumentDTO'
 *             examples:
 *               success:
 *                 summary: Example updated document response
 *                 value:
 *                   success: true
 *                   data:
 *                     tokenId: 123
 *                     owner: "0x123abc..."
 *                     fileHash: "Qmabcdef..."
 *                     uri: "https://storage.example.com/docs/doc-123.pdf"
 *                     docType: "Invoice"
 *                     linkedContracts: ["0xcontract1"]
 *                     status: "Reviewed"
 *                     signer: "0xSigner1"
 *                     createdAt: 1699286400000
 *                     updatedAt: 1699372800000
 *                     name: "Invoice #123 Updated"
 *                     description: "Updated invoice description"
 *                     metadataUrl: "https://metadata.example.com/doc-123.json"
 *
 *       401:
 *         description: Unauthorized — missing or invalid bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing or invalid Authorization header"
 *
 *       404:
 *         description: Document not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Document not found"
 *
 *       422:
 *         description: Unprocessable entity — invalid tokenId or missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidTokenId:
 *                 summary: Invalid token ID format
 *                 value:
 *                   success: false
 *                   message: "Invalid tokenId format"
 *               missingAction:
 *                 summary: Missing action field
 *                 value:
 *                   success: false
 *                   message: "Missing action field"
 *               missingAccount:
 *                 summary: Missing account field
 *                 value:
 *                   success: false
 *                   message: "Missing account field"
 *
 *       500:
 *         description: Server error while updating the document
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to update document"
 */
router.patch("/:tokenId", authMiddleware, updateDocument);

/**
 * @swagger
 * /api/document/{tokenId}:
 *   delete:
 *     tags: [Document]
 *     summary: Delete a document
 *     description: Delete a document identified by token ID. Requires `action` and `account` fields for logging.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Document token ID
 *         example: 123
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *               account:
 *                 type: string
 *               txHash:
 *                 type: string
 *           example:
 *             action: "Deleted"
 *             account: "0xSigner1"
 *             txHash: "0xTransactionHash1"
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Document deleted successfully"
 *       401:
 *         description: Unauthorized — missing or invalid bearer token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Missing or invalid Authorization header"
 *       404:
 *         description: Document not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Document not found"
 *       422:
 *         description: Unprocessable entity — missing required fields or invalid tokenId
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingAction:
 *                 summary: Missing action field
 *                 value:
 *                   success: false
 *                   message: "Missing action field"
 *               missingAccount:
 *                 summary: Missing account field
 *                 value:
 *                   success: false
 *                   message: "Missing account field"
 *               invalidTokenId:
 *                 summary: Invalid token ID format
 *                 value:
 *                   success: false
 *                   message: "Invalid tokenId format"
 *       500:
 *         description: Server error while deleting document
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to delete document"
 */
router.delete("/:tokenId", authMiddleware, deleteDocument);

export default router;
