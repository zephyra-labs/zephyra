/**
 * @file userModel.test.ts
 * @description Unit tests for UserModel (mocked in setup.ts)
 */

import { UserModel } from "@/models/userModel"
import type { User } from "@/types/User"

describe("UserModel", () => {
  const mockUser: User = {
    address: "0x123",
    role: "user",
    metadata: {
      name: "Test User",
      email: "qSb8T@example.com",
      kycStatus: "pending",
    },
    lastLoginAt: Date.now(),
    createdAt: Date.now(),
  }

  beforeEach(() => {
    // Reset datastore before each test
    const store = (UserModel as any).__dataStore
    for (const key of Object.keys(store)) delete store[key]
  })

  it("should create a new user", async () => {
    const result = await UserModel.create(mockUser)
    expect(result).toEqual(mockUser)
    expect((UserModel as any).__dataStore[mockUser.address]).toBeDefined()
  })

  it("should throw error if user already exists", async () => {
    await UserModel.create(mockUser)
    await expect(UserModel.create(mockUser)).rejects.toThrow(
      `User with address ${mockUser.address} already exists`
    )
  })

  it("should retrieve all users", async () => {
    await UserModel.create(mockUser)
    const users = await UserModel.getAll()
    expect(Array.isArray(users)).toBe(true)
    expect(users.length).toBe(1)
    expect(users[0]).toEqual(mockUser)
  })

  it("should retrieve a user by address", async () => {
    await UserModel.create(mockUser)
    const user = await UserModel.getByAddress(mockUser.address)
    expect(user).toEqual(mockUser)
  })

  it("should return null if user not found", async () => {
    const user = await UserModel.getByAddress("0x999")
    expect(user).toBeNull()
  })

  it("should update user metadata name", async () => {
    await UserModel.create(mockUser)

    const updated = await UserModel.update(
      mockUser.address,
      { metadata: { name: "Updated Name" } }
    );
    
    expect(updated).not.toBeNull()
    expect(updated?.metadata?.name).toBe("Updated Name")
  })

  it("should return null if updating non-existing user", async () => {
    const updated = await UserModel.update(
      "0x999",
      { metadata: { name: "No User" } }
    )
    expect(updated).toBeNull()
  })

  it("should delete existing user", async () => {
    await UserModel.create(mockUser)
    const deleted = await UserModel.delete(mockUser.address)
    expect(deleted).toBe(true)
    expect(await UserModel.getByAddress(mockUser.address)).toBeNull()
  })

  it("should return false if deleting non-existing user", async () => {
    const deleted = await UserModel.delete("0x999")
    expect(deleted).toBe(false)
  })
})
