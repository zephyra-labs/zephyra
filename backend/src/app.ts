import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import morgan from 'morgan'
import http from 'http'
import { WebSocket, WebSocketServer } from 'ws'

// Routes
import contractRoutes from './routes/contractRoutes.js'
import walletRoutes from './routes/walletRoutes.js'
import kycRoutes from './routes/kycRoutes.js'
import companyRoutes from './routes/companyRoutes.js'
import documentRoutes from './routes/documentRoutes.js'
import activityRoutes from './routes/activityRoutes.js'
import aggregatedActivityRoutes from './routes/aggregatedActivityRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import userRoutes from './routes/userRoutes.js'
import userCompanyRoutes from './routes/userCompanyRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'

dotenv.config()

const app = express()

// Middleware
app.use(cors())
app.use(morgan('dev'))

app.use('/api/kyc', kycRoutes)

app.use(express.json())

// Routes
app.get('/', (req, res) => res.send('Backend is running'))

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

// --- HTTP server & WebSocket ---
const PORT = process.env.PORT || 5000
const server = http.createServer(app)

// --- WebSocket server ---
export const wss = new WebSocketServer({ server, path: '/ws/notifications' })

// Map userId => WebSocket
const clients = new Map<string, WebSocket>()

wss.on('connection', (ws, req) => {
  const url = new URL(req.url!, `http://${req.headers.host}`)
  const userId = url.searchParams.get('userId')?.toLowerCase()
  if (!userId) {
    ws.close(1008, 'Missing userId')
    return
  }

  console.log(`User ${userId} connected via WS`)
  clients.set(userId, ws)

  ws.on('close', () => {
    clients.delete(userId)
    console.log(`User ${userId} disconnected`)
  })
})

// --- Broadcast notification to a specific user ---
export function broadcastNotificationToUser(userId: string, notif: any) {
  const ws = clients.get(userId.toLowerCase())
  if (ws && ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({ event: 'notification', data: notif }))
  }
}

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})