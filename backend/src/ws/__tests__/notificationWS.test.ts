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
  let consoleLogSpy: jest.SpyInstance

  beforeEach(() => {
    server = {}
    ;(WebSocketServer as unknown as jest.Mock).mockClear()
    clients.clear()
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    process.env.NODE_ENV = 'test'
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
  })

  it('should initialize WS server and store userId', () => {
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

  it('should close connection if host header missing', () => {
    const wsMock: any = { on: jest.fn(), close: jest.fn() }
    const wssMock = { on: jest.fn((event: string, cb: Function) => cb(wsMock, { headers: {} })) }
    ;(WebSocketServer as unknown as jest.Mock).mockImplementation(() => wssMock)

    initNotificationWS(server as HTTPServer)
    expect(wsMock.close).toHaveBeenCalledWith(1011, 'Missing host header')
  })

  it('should close connection if userId missing', () => {
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

  it('should remove client on close', () => {
    let closeCb: Function
    const wsMock: any = { on: jest.fn((e, cb) => e === 'close' && (closeCb = cb)), close: jest.fn() }
    const wssMock = {
      on: jest.fn((event, cb) =>
        cb(wsMock, { headers: { host: 'localhost' }, url: '/ws/notifications?userId=USER123' })
      ),
    }
    ;(WebSocketServer as unknown as jest.Mock).mockImplementation(() => wssMock)

    initNotificationWS(server as HTTPServer)
    expect(clients.has('USER123')).toBe(true)
    closeCb!()
    expect(clients.has('USER123')).toBe(false)
  })

  it('should log connection and disconnection if NODE_ENV !== test', () => {
    process.env.NODE_ENV = 'production'
    let closeCb: Function
    const wsMock: any = { on: jest.fn((e, cb) => e === 'close' && (closeCb = cb)), close: jest.fn() }
    const wssMock = {
      on: jest.fn((event, cb) =>
        cb(wsMock, { headers: { host: 'localhost' }, url: '/ws/notifications?userId=USERLOG' })
      ),
    }
    ;(WebSocketServer as unknown as jest.Mock).mockImplementation(() => wssMock)

    initNotificationWS(server as HTTPServer)
    expect(consoleLogSpy).toHaveBeenCalledWith('User USERLOG connected via WS')
    closeCb!()
    expect(consoleLogSpy).toHaveBeenCalledWith('User USERLOG disconnected')
  })

  it('broadcast sends notification if WS is open', () => {
    const sendMock = jest.fn()
    const wsMock: any = { readyState: 1, send: sendMock }
    clients.set('USER123', wsMock)

    const notif: NotificationPayload = { id: 'n1', executorId: 'e1', type: 'system', createdAt: Date.now(), title: 'T', message: 'M' }
    broadcastNotificationToUser('USER123', notif)
    expect(sendMock).toHaveBeenCalledWith(JSON.stringify({ event: 'notification', data: notif }))
  })

  it('broadcast does nothing if WS not open', () => {
    const sendMock = jest.fn()
    const wsMock: any = { readyState: 0, send: sendMock }
    clients.set('USER123', wsMock)

    const notif: NotificationPayload = { id: 'n1', executorId: 'e1', type: 'system', createdAt: Date.now(), title: 'T', message: 'M' }
    broadcastNotificationToUser('USER123', notif)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('broadcast does nothing if userId not in clients map', () => {
    const notif: NotificationPayload = { id: 'n2', executorId: 'e2', type: 'system', createdAt: Date.now(), title: 'X', message: 'Y' }
    broadcastNotificationToUser('UNKNOWN', notif) // should not throw
  })

  it('handles multiple connections', () => {
    const ws1: any = { on: jest.fn(), close: jest.fn() }
    const ws2: any = { on: jest.fn(), close: jest.fn() }
    const wssMock = {
      on: jest.fn((event, cb) => {
        if (event === 'connection') {
          cb(ws1, { headers: { host: 'localhost' }, url: '/ws/notifications?userId=U1' })
          cb(ws2, { headers: { host: 'localhost' }, url: '/ws/notifications?userId=U2' })
        }
      }),
    }
    ;(WebSocketServer as unknown as jest.Mock).mockImplementation(() => wssMock)
    initNotificationWS(server as HTTPServer)
    expect(clients.has('U1')).toBe(true)
    expect(clients.has('U2')).toBe(true)
  })
})
