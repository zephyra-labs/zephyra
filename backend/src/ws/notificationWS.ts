/**
 * @file notificationWS.ts
 * @description
 * WebSocket server for real-time notifications.
 */

import { WebSocket, WebSocketServer } from 'ws'
import type { NotificationPayload } from '../types/Notification'
import type { Server as HTTPServer } from 'http'

/**
 * Maps userId (lowercased) to WebSocket connection
 */
const clients = new Map<string, WebSocket>()

/**
 * Initialize WebSocket server for notifications
 * @param server - HTTP server to attach WebSocket server
 * @returns WebSocketServer instance
 */
export function initNotificationWS(server: HTTPServer): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/ws/notifications' })

  wss.on('connection', (ws, req) => {
    if (!req.headers.host) {
      ws.close(1011, 'Missing host header')
      return
    }

    const url = new URL(req.url!, `http://${req.headers.host}`)
    const userId = url.searchParams.get('userId')

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

  return wss
}

/**
 * Send a real-time notification to a specific user
 * @param userId - Wallet address or system ID of the user
 * @param notif - Notification payload to send
 */
export function broadcastNotificationToUser(userId: string, notif: NotificationPayload) {
  const ws = clients.get(userId)
  if (ws && ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({ event: 'notification', data: notif }))
  }
}
