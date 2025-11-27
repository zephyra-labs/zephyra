/**
 * @file app.ts
 * @description
 * Main entry point for Zephyra backend.
 * Sets up Express server, middleware, API routes, Swagger documentation, and WebSocket server for real-time notifications.
 */

import express, { type Application, type Request, type Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import morgan from 'morgan'
import http from 'http'
import { setupSwagger } from './config/swagger'

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
import tradeRoutes from './routes/tradeRoutes'
import reportRoutes from './routes/reportRoutes'

// -------------------- Environment --------------------
dotenv.config()

// -------------------- Express App --------------------
const app: Application = express()

// -------------------- Middleware --------------------
app.use(cors()) // Enable Cross-Origin Resource Sharing
app.use(morgan('dev')) // HTTP request logger

// KYC routes (file upload + multi-endpoint)
app.use('/api/kyc', kycRoutes)

app.use(express.json()) // JSON parser for request bodies

// -------------------- Routes --------------------
/**
 * @route GET /
 * @description Health check endpoint
 * @returns {string} Returns a simple message indicating server status
 */
app.get('/', (_req: Request, res: Response) => {
  res.status(200).send('✅ Zephyra backend is running smoothly.')
})

// Attach all API route groups
app.use('/api/activity', activityRoutes)
app.use('/api/aggregated', aggregatedActivityRoutes)
app.use('/api/company', companyRoutes)
app.use('/api/contract', contractRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/document', documentRoutes)
app.use('/api/notification', notificationRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/trade', tradeRoutes)
app.use('/api/user-company', userCompanyRoutes)
app.use('/api/user', userRoutes)
app.use('/api/wallet', walletRoutes)

// -------------------- Swagger --------------------
setupSwagger(app)

// -------------------- HTTP Server & WebSocket --------------------
const PORT = process.env.PORT || 5000

/** Create HTTP server to attach both Express and WebSocket */
const server = http.createServer(app)

/**
 * Initialize WebSocket server for real-time notifications
 */
export const wss = initNotificationWS(server)

// -------------------- Start Server --------------------
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})

export default app
