/**
 * @file responseHelper.test.ts
 * @description Unit tests for responseHelper functions using Jest.
 */

import { success, failure, handleError } from '../responseHelper'
import type { Response } from 'express'

describe('responseHelper', () => {
  let res: Partial<Response>

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
    jest.clearAllMocks()
  })

  /**
   * @test success response
   * Should call res.status and res.json with correct payload
   */
  it('should send success response with default status 200', () => {
    const data = { foo: 'bar' }
    success(res as Response, data)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ success: true, data })
  })

  it('should send success response with custom status', () => {
    const data = { foo: 'bar' }
    success(res as Response, data, 201)
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({ success: true, data })
  })

  /**
   * @test failure response
   * Should call res.status and res.json with correct error message
   */
  it('should send failure response with default status 400', () => {
    const message = 'Something went wrong'
    failure(res as Response, message)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ success: false, message })
  })

  it('should send failure response with custom status', () => {
    const message = 'Forbidden'
    failure(res as Response, message, 403)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ success: false, message })
  })

  /**
   * @test handleError
   * Should log error and call failure with proper message
   */
  it('should handle unknown error and send 500', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    const err = new Error('Boom')
    handleError(res as Response, err)
    expect(consoleSpy).toHaveBeenCalledWith('❌ Error:', err)
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Boom' })
    consoleSpy.mockRestore()
  })

  it('should handle string error and custom message', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    const err = 'Some string error'
    handleError(res as Response, err, 'Custom message', 501)
    expect(consoleSpy).toHaveBeenCalledWith('❌ Error:', err)
    expect(res.status).toHaveBeenCalledWith(501)
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Custom message' })
    consoleSpy.mockRestore()
  })
})
