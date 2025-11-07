/**
 * @file notificationHelper.test.ts
 * @description Unit tests for notificationHelper functions using Jest.
 */

import { notifyWithAdmins, notifyUsers, NotifyPayload } from '../notificationHelper'
import { NotificationService } from '../../services/notificationService'

// --- Mock NotificationService.notify ---
jest.mock('../../services/notificationService', () => ({
  NotificationService: {
    notify: jest.fn(),
  },
}))

describe('notificationHelper', () => {
  const executor = '0xExecutor'
  const admins = ['0xAdmin1', '0xAdmin2', executor]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ───────────────────────────────────────────────
  /**
   * @test notifyWithAdmins
   * Should notify all admins except executor with default type
   */
  it('should notify all admins except executor with default type', async () => {
    const payload: NotifyPayload = { title: 'Hello', message: 'World' }

    await notifyWithAdmins(executor, payload, admins)

    expect(NotificationService.notify).toHaveBeenCalledTimes(2)
    expect(NotificationService.notify).toHaveBeenCalledWith(
      '0xAdmin1',
      executor,
      'system',
      'Hello',
      'World',
      { txHash: undefined, data: undefined }
    )
    expect(NotificationService.notify).toHaveBeenCalledWith(
      '0xAdmin2',
      executor,
      'system',
      'Hello',
      'World',
      { txHash: undefined, data: undefined }
    )
  })

  it('should use provided type if valid', async () => {
    const payload: NotifyPayload = { title: 'Hello', message: 'World', type: 'kyc' }
    await notifyWithAdmins(executor, payload, admins)
    expect(NotificationService.notify).toHaveBeenCalledWith(
      '0xAdmin1',
      executor,
      'kyc',
      'Hello',
      'World',
      { txHash: undefined, data: undefined }
    )
  })

  it('should default to system type if invalid', async () => {
    const payload: NotifyPayload = { title: 'Hi', message: 'Test', type: 'invalid' as any }
    await notifyWithAdmins(executor, payload, admins)
    expect(NotificationService.notify).toHaveBeenCalledWith(
      '0xAdmin1',
      executor,
      'system',
      'Hi',
      'Test',
      { txHash: undefined, data: undefined }
    )
  })

  // ───────────────────────────────────────────────
  /**
   * @test notifyUsers
   * Should notify multiple users and normalize addresses
   */
  it('should notify a list of users', async () => {
    const recipients = ['0xUser1', '0xUser2']
    const payload: NotifyPayload = { title: 'Hello', message: 'World' }

    await notifyUsers(recipients, payload, executor)

    expect(NotificationService.notify).toHaveBeenCalledTimes(2)
    expect(NotificationService.notify).toHaveBeenCalledWith(
      '0xuser1',
      executor,
      'system',
      'Hello',
      'World',
      { txHash: undefined, data: undefined }
    )
    expect(NotificationService.notify).toHaveBeenCalledWith(
      '0xuser2',
      executor,
      'system',
      'Hello',
      'World',
      { txHash: undefined, data: undefined }
    )
  })

  it('should notify a single user string', async () => {
    const recipient = '0xUser1'
    const payload: NotifyPayload = { title: 'Hello', message: 'World' }

    await notifyUsers(recipient, payload, executor)

    expect(NotificationService.notify).toHaveBeenCalledTimes(1)
    expect(NotificationService.notify).toHaveBeenCalledWith(
      '0xuser1',
      executor,
      'system',
      'Hello',
      'World',
      { txHash: undefined, data: undefined }
    )
  })

  it('should include txHash and data if provided', async () => {
    const recipients = ['0xUser1']
    const payload: NotifyPayload = { title: 'Tx', message: 'Test', txHash: '0x123', data: { foo: 1 } }

    await notifyUsers(recipients, payload, executor)

    expect(NotificationService.notify).toHaveBeenCalledWith(
      '0xuser1',
      executor,
      'system',
      'Tx',
      'Test',
      { txHash: '0x123', data: { foo: 1 } }
    )
  })

  it('should remove duplicates in recipients', async () => {
    const recipients = ['0xUser1', '0xUser1', '0xUSER1']
    const payload: NotifyPayload = { title: 'Hello', message: 'World' }

    await notifyUsers(recipients, payload, executor)

    expect(NotificationService.notify).toHaveBeenCalledTimes(1)
  })

  it('should handle empty recipients gracefully', async () => {
    const payload: NotifyPayload = { title: 'No One', message: 'Empty' }

    await notifyUsers([], payload, executor)

    expect(NotificationService.notify).not.toHaveBeenCalled()
  })

  it('should use type "system" if payload.type invalid in notifyUsers', async () => {
    const payload: NotifyPayload = { title: 'Hello', message: 'World', type: 'invalid' as any }

    await notifyUsers(['0xUser1'], payload, executor)

    expect(NotificationService.notify).toHaveBeenCalledWith(
      '0xuser1',
      executor,
      'system',
      'Hello',
      'World',
      { txHash: undefined, data: undefined }
    )
  })
})
