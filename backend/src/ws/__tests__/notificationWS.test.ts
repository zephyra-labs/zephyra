/**
 * @file notificationWS.test.ts
 * @description Unit tests for notificationWS using Jest.
 * Tests WebSocket server initialization, connection handling, and broadcasting notifications.
 */

import { initNotificationWS, broadcastNotificationToUser, clients } from '../notificationWS'
import { WebSocketServer } from 'ws'
import type { Server as HTTPServer } from 'http'
import type { NotificationPayload } from '../../types/Notification'

jest.mock('ws', () => {
  const actual = jest.requireActual('ws')
  return {
    ...actual,
    WebSocketServer: jest.fn(),
  }
})

describe('notificationWS', () => {
  let server: Partial<HTTPServer>

  beforeEach(() => {
    server = {}
    ;(WebSocketServer as unknown as jest.Mock).mockClear()
    clients.clear()
  })

  /**
   * @test Initialize WebSocket server and handle connection with userId
   * Ensures userId is stored in clients map
   */
  it('should initialize WebSocket server and handle connection with userId', () => {
    const wsMock: any = { on: jest.fn(), close: jest.fn() }

    const wssMock = {
      on: jest.fn((event: string, cb: Function) => {
        if (event === 'connection') {
          cb(wsMock, { headers: { host: 'localhost' }, url: '/ws/notifications?userId=USER123' })
        }
      }),
    }

    ;(WebSocketServer as unknown as jest.Mock).mockImplementation(() => wssMock)

    const wss = initNotificationWS(server as HTTPServer)
    expect(WebSocketServer).toHaveBeenCalledWith({ server, path: '/ws/notifications' })
    expect(wss).toBe(wssMock)
    expect(clients.has('USER123')).toBe(true)
  })

  /**
   * @test Close connection if host header is missing
   */
  it('should close connection if host header is missing', () => {
    const wsMock: any = { on: jest.fn(), close: jest.fn() }
    const wssMock = { on: jest.fn((event: string, cb: Function) => cb(wsMock, { headers: {} })) }
    ;(WebSocketServer as unknown as jest.Mock).mockImplementation(() => wssMock)

    initNotificationWS(server as HTTPServer)
    expect(wsMock.close).toHaveBeenCalledWith(1011, 'Missing host header')
  })

  /**
   * @test Close connection if userId is missing
   */
  it('should close connection if userId is missing', () => {
    const wsMock: any = { on: jest.fn(), close: jest.fn() }
    const wssMock = {
      on: jest.fn((event: string, cb: Function) =>
        cb(wsMock, { headers: { host: 'localhost' }, url: '/ws/notifications' })
      ),
    }
    ;(WebSocketServer as unknown as jest.Mock).mockImplementation(() => wssMock)

    initNotificationWS(server as HTTPServer)
    expect(wsMock.close).toHaveBeenCalledWith(1008, 'Missing userId')
  })

  /**
   * @test Remove client from map on close
   */
  it('should remove client from map on close', () => {
    let closeCb: Function
    const wsMock: any = {
      on: jest.fn((event: string, cb: Function) => { if (event === 'close') closeCb = cb }),
      close: jest.fn(),
    }

    const wssMock = {
      on: jest.fn((event: string, cb: Function) =>
        cb(wsMock, { headers: { host: 'localhost' }, url: '/ws/notifications?userId=USER123' })
      ),
    }
    ;(WebSocketServer as unknown as jest.Mock).mockImplementation(() => wssMock)

    initNotificationWS(server as HTTPServer)
    expect(clients.has('USER123')).toBe(true)
    closeCb!()
    expect(clients.has('USER123')).toBe(false)
  })

  /**
   * @test Send notification if WebSocket is open
   */
  it('should send notification if WebSocket is open', () => {
    const sendMock = jest.fn()
    const wsMock: any = { readyState: 1, send: sendMock } // 1 = OPEN
    clients.set('USER123', wsMock)

    const notif: NotificationPayload = {
      id: 'notif1',
      executorId: 'executor1',
      type: 'system',
      createdAt: Date.now(),
      title: 'Hello',
      message: 'World',
    }

    broadcastNotificationToUser('USER123', notif)
    expect(sendMock).toHaveBeenCalledWith(JSON.stringify({ event: 'notification', data: notif }))
  })

  /**
   * @test Do not send notification if WebSocket is not open
   */
  it('should not send notification if WebSocket is not open', () => {
    const sendMock = jest.fn()
    const wsMock: any = { readyState: 0, send: sendMock } // 0 = CONNECTING
    clients.set('USER123', wsMock)

    const notif: NotificationPayload = {
      id: 'notif1',
      executorId: 'executor1',
      type: 'system',
      createdAt: Date.now(),
      title: 'Hello',
      message: 'World',
    }

    broadcastNotificationToUser('USER123', notif)
    expect(sendMock).not.toHaveBeenCalled()
  })
})
