/**
 * @file userDTO.test.ts
 * @description Unit tests for UserDTO, CreateUserDTO, and UpdateUserDTO
 */

import UserDTO, { CreateUserDTO, UpdateUserDTO } from "../userDTO";

describe("UserDTO", () => {
  it("should throw if address is missing", () => {
    expect(() => new UserDTO({} as any)).toThrow(/address is required/);
  });

  it("should create DTO with default values", () => {
    const address = "0xabc123";
    const dto = new UserDTO({ address });
    expect(dto.address).toBe(address);
    expect(dto.role).toBe("user");
    expect(typeof dto.createdAt).toBe("number");
    expect(typeof dto.lastLoginAt).toBe("number");
    expect(dto.metadata).toEqual({});
  });

  it("should convert to Firestore object", () => {
    const address = "0xabc123";
    const dto = new UserDTO({ address, role: "admin", metadata: { name: "Alice" }, createdAt: 123, lastLoginAt: 456 });
    const fsObj = dto.toFirestore();
    expect(fsObj).toEqual({
      address: "0xabc123",
      role: "admin",
      createdAt: 123,
      lastLoginAt: 456,
      metadata: { name: "Alice" },
    });
  });
});

describe("CreateUserDTO", () => {
  it("should throw if address is missing", () => {
    expect(() => new CreateUserDTO({} as any)).toThrow(/Address is required/);
  });

  it("should create DTO with default values", () => {
    const address = "0xabc123";
    const dto = new CreateUserDTO({ address });
    expect(dto.address).toBe(address);
    expect(dto.role).toBe("user");
    expect(dto.metadata).toEqual({
      name: "-",
      email: "-",
      kycStatus: "pending" as "pending", // ← pastikan tipe union
    });
  });

  it("should convert to Firestore object", () => {
    const address = "0xabc123";
    const metadata = {
      name: "Bob",
      email: "bob@example.com",
      kycStatus: "approved" as "approved",
    };
    const dto = new CreateUserDTO({ address, role: "admin", metadata });
    const fsObj = dto.toFirestore();
    expect(fsObj.address).toBe(address);
    expect(fsObj.role).toBe("admin");
    expect(fsObj.metadata).toEqual(metadata);
    expect(typeof fsObj.createdAt).toBe("number");
    expect(typeof fsObj.lastLoginAt).toBe("number");
  });
});

describe("UpdateUserDTO", () => {
  it("should create DTO with partial updates", () => {
    const dto = new UpdateUserDTO({
      role: "admin",
      metadata: { name: "Charlie" },
      lastLoginAt: 999,
      kycStatus: "approved",
    });
    expect(dto.role).toBe("admin");
    expect(dto.metadata).toEqual({ name: "Charlie" });
    expect(dto.lastLoginAt).toBe(999);
    expect(dto.kycStatus).toBe("approved");
  });

  it("should allow empty partial update", () => {
    const dto = new UpdateUserDTO({});
    expect(dto.role).toBeUndefined();
    expect(dto.metadata).toBeUndefined();
    expect(dto.lastLoginAt).toBeUndefined();
    expect(dto.kycStatus).toBeUndefined();
  });
});
