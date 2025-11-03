/**
 * @file app.ts
 * @description
 * Main backend entry point for Zephyra backend.
 * Sets up Express server, middleware, API routes, and WebSocket server for real-time notifications.
 */

import express, { Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import morgan from 'morgan'
import http from 'http'

// Routes
import { initNotificationWS } from './ws/notificationWS'
import contractRoutes from './routes/contractRoutes'
import walletRoutes from './routes/walletRoutes'
import kycRoutes from './routes/kycRoutes'
import companyRoutes from './routes/companyRoutes'
import documentRoutes from './routes/documentRoutes'
import activityRoutes from './routes/activityRoutes'
import aggregatedActivityRoutes from './routes/aggregatedActivityRoutes'
import notificationRoutes from './routes/notificationRoutes'
import userRoutes from './routes/userRoutes'
import userCompanyRoutes from './routes/userCompanyRoutes'
import dashboardRoutes from './routes/dashboardRoutes'

// Load environment variables from .env file
dotenv.config()

// -------------------- Express App --------------------
/** @type {Application} */
const app = express()

// -------------------- Middleware --------------------
app.use(cors()) // Enable Cross-Origin Resource Sharing
app.use(morgan('dev')) // HTTP request logger

// KYC routes (file upload + multi-endpoint)
app.use('/api/kyc', kycRoutes)

// JSON parser for request bodies
app.use(express.json())

// -------------------- Routes --------------------
/**
 * @route GET /
 * @description Health check endpoint
 */
app.get('/', (req: Request, res: Response) => res.send('Backend is running'))

// Other API routes
app.use('/api/contract', contractRoutes)
app.use('/api/wallet', walletRoutes)
app.use('/api/company', companyRoutes)
app.use('/api/document', documentRoutes)
app.use('/api/activity', activityRoutes)
app.use('/api/aggregated', aggregatedActivityRoutes)
app.use('/api/notification', notificationRoutes)
app.use('/api/user', userRoutes)
app.use('/api/user-company', userCompanyRoutes)
app.use('/api/dashboard', dashboardRoutes)

// -------------------- HTTP Server & WebSocket --------------------
/** Server port from environment or default 5000 */
const PORT = process.env.PORT || 5000

/** HTTP server for Express app */
const server = http.createServer(app)

/**
 * @description Initialize WebSocket server for real-time notifications
 * @type {import('ws').WebSocketServer}
 */
export const wss = initNotificationWS(server)

// -------------------- Start Server --------------------
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})
