/**
 * @file userCompanyDTO.test.ts
 * @description Unit tests for UserCompanyDTO, fromCreateDTO, and applyUpdate
 */

import UserCompanyDTO from "../userCompanyDTO";
import type { CreateUserCompanyDTO, UpdateUserCompanyDTO } from "../../types/UserCompany";

describe("UserCompanyDTO", () => {
  const baseData = {
    id: "123",
    userAddress: "0xabc",
    companyId: "comp1",
    role: "admin" as const,
    status: "active" as const,
    joinedAt: 1000,
    updatedAt: 2000,
    txHash: "0xhash",
    onchainJoinedAt: 3000,
  };

  /* -------------------------- Constructor Tests -------------------------- */

  it("should throw if userAddress is missing", () => {
    expect(() => new UserCompanyDTO({ companyId: "comp1" } as any)).toThrow(/userAddress is required/);
  });

  it("should throw if companyId is missing", () => {
    expect(() => new UserCompanyDTO({ userAddress: "0xabc" } as any)).toThrow(/companyId is required/);
  });

  it("should create DTO with provided values", () => {
    const dto = new UserCompanyDTO(baseData);
    expect(dto.id).toBe("123");
    expect(dto.userAddress).toBe("0xabc");
    expect(dto.companyId).toBe("comp1");
    expect(dto.role).toBe("admin");
    expect(dto.status).toBe("active");
    expect(dto.joinedAt).toBe(1000);
    expect(dto.updatedAt).toBe(2000);
    expect(dto.txHash).toBe("0xhash");
    expect(dto.onchainJoinedAt).toBe(3000);
  });

  it("should assign default role/status/joinedAt if missing", () => {
    const dto = new UserCompanyDTO({ userAddress: "0xabc", companyId: "comp1" });
    expect(dto.role).toBe("staff");
    expect(dto.status).toBe("pending");
    expect(typeof dto.joinedAt).toBe("number");
  });

  /* ------------------------- toFirestore Tests --------------------------- */

  it("should convert to Firestore object", () => {
    const dto = new UserCompanyDTO(baseData);
    const fsObj = dto.toFirestore();
    expect(fsObj).toEqual({
      userAddress: "0xabc",
      companyId: "comp1",
      role: "admin",
      status: "active",
      joinedAt: 1000,
      updatedAt: 2000,
      txHash: "0xhash",
      onchainJoinedAt: 3000,
    });
  });

  /* ---------------------- fromCreateDTO Tests ---------------------------- */

  it("should create from CreateUserCompanyDTO with provided values", () => {
    const createDto: CreateUserCompanyDTO = {
      userAddress: "0xabc",
      companyId: "comp1",
      role: "staff",
      status: "pending",
      txHash: "0xhash",
      joinedAt: Date.now(),
    };
    const dto = UserCompanyDTO.fromCreateDTO(createDto);
    expect(dto.userAddress).toBe("0xabc");
    expect(dto.companyId).toBe("comp1");
    expect(dto.role).toBe("staff");
    expect(dto.status).toBe("pending");
    expect(dto.txHash).toBe("0xhash");
    expect(typeof dto.joinedAt).toBe("number");
  });

  it("fromCreateDTO should apply default role/status/joinedAt when missing", () => {
    const createDto: CreateUserCompanyDTO = {
      userAddress: "0xabc",
      companyId: "comp1",
      txHash: "0xhash",
      joinedAt: Date.now(),
    };
    const dto = UserCompanyDTO.fromCreateDTO(createDto);
    expect(dto.role).toBe("staff");       // default applied
    expect(dto.status).toBe("pending");   // default applied
    expect(typeof dto.joinedAt).toBe("number"); // joinedAt defaulted
    expect(dto.txHash).toBe("0xhash");
  });

  /* ---------------------- applyUpdate Tests ----------------------------- */

  it("should apply updates correctly", () => {
    const dto = new UserCompanyDTO(baseData);
    const updateDto: UpdateUserCompanyDTO = {
      role: "staff",
      status: "pending",
      txHash: "0xnewhash",
      onchainJoinedAt: 4000,
      updatedAt: 5000,
    };
    dto.applyUpdate(updateDto);
    expect(dto.role).toBe("staff");
    expect(dto.status).toBe("pending");
    expect(dto.txHash).toBe("0xnewhash");
    expect(dto.onchainJoinedAt).toBe(4000);
    expect(dto.updatedAt).toBe(5000);
  });

  it("applyUpdate should apply updatedAt default if not provided", () => {
    const dto = new UserCompanyDTO(baseData);
    const updateDto: UpdateUserCompanyDTO = { role: "staff" };
    dto.applyUpdate(updateDto);
    expect(dto.role).toBe("staff");
    expect(typeof dto.updatedAt).toBe("number"); // default timestamp applied
  });

  it("applyUpdate should not overwrite unspecified fields", () => {
    const dto = new UserCompanyDTO(baseData);
    const updateDto: UpdateUserCompanyDTO = { txHash: "0xnewhash" };
    dto.applyUpdate(updateDto);
    expect(dto.role).toBe("admin");        // original retained
    expect(dto.status).toBe("active");     // original retained
    expect(dto.txHash).toBe("0xnewhash");  // updated
  });
});
