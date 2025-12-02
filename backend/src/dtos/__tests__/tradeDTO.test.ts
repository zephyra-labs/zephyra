/**
 * @file tradeDTO.test.ts
 * @description Unit tests for TradeDTO covering constructor defaults, validation, and transformation
 */

import TradeDTO from "../tradeDTO";
import type { TradeParticipant, TradeRecord } from "../../types/Trade";

describe("TradeDTO", () => {
  const participantsFull: TradeParticipant[] = [
    { address: "0xabc", role: "exporter", kycVerified: true, walletConnected: true },
  ];

  const participantsPartial = [
    { address: "0xabc", role: "exporter" }, // missing kycVerified/walletConnected
  ] as unknown as TradeParticipant[];

  const baseData: Partial<TradeRecord> = {
    contractAddress: "0xcontract",
    participants: participantsFull,
    status: "draft",
    currentStage: 1,
  };

  /* -------------------------------------------------------------------------- */
  /*                             Constructor tests                               */
  /* -------------------------------------------------------------------------- */

  it("constructor should set defaults if called with no data", () => {
    const dto = new TradeDTO();
    expect(dto.id).toBeDefined();
    expect(typeof dto.createdAt).toBe("number");
    expect(dto.participants).toEqual([]);
  });

  it("constructor should preserve provided data", () => {
    const now = Date.now();
    const dto = new TradeDTO({ ...baseData, id: "trade123", createdAt: now });
    expect(dto.id).toBe("trade123");
    expect(dto.createdAt).toBe(now);
    expect(dto.status).toBe("draft");
  });

  /* -------------------------------------------------------------------------- */
  /*                             Validate tests                                  */
  /* -------------------------------------------------------------------------- */

  it("validate should throw if id is missing", () => {
    const dto = new TradeDTO(baseData as any);
    dto.id = "";
    expect(() => dto.validate()).toThrow(/TradeRecord id is required/);
  });

  it("validate should throw if participants missing or empty", () => {
    const dto = new TradeDTO({ ...baseData, participants: [] });
    expect(() => dto.validate()).toThrow(/At least one participant is required/);

    const dto2 = new TradeDTO({ ...baseData, participants: undefined } as any);
    expect(() => dto2.validate()).toThrow(/At least one participant is required/);
  });

  it("validate should throw if status is missing", () => {
    const dto = new TradeDTO({ ...baseData, status: undefined } as any);
    expect(() => dto.validate()).toThrow(/Trade status is required/);
  });

  /* -------------------------------------------------------------------------- */
  /*                             toTradeRecord tests                             */
  /* -------------------------------------------------------------------------- */

  it("toTradeRecord should transform DTO correctly with full participant fields", () => {
    const dto = new TradeDTO(baseData);
    const record = dto.toTradeRecord();
    expect(record.id).toBe(dto.id);
    expect(record.contractAddress).toBe("0xcontract");
    expect(record.participants[0].address).toBe("0xabc");
    expect(record.participants[0].kycVerified).toBe(true);
    expect(record.participants[0].walletConnected).toBe(true);
    expect(record.participants[0].role).toBe("exporter");
    expect(record.status).toBe("draft");
    expect(record.currentStage).toBe(1);
    expect(record.createdAt).toBe(dto.createdAt);
    expect(record.updatedAt).toBeUndefined();
  });

  it("toTradeRecord should apply default false for missing participant kycVerified/walletConnected", () => {
    const dto = new TradeDTO({ ...baseData, participants: participantsPartial });
    const record = dto.toTradeRecord();
    expect(record.participants[0].kycVerified).toBe(false);
    expect(record.participants[0].walletConnected).toBe(false);
  });

  /* -------------------------------------------------------------------------- */
  /*                               Touch test                                    */
  /* -------------------------------------------------------------------------- */

  it("touch should update updatedAt timestamp", () => {
    const dto = new TradeDTO(baseData);
    expect(dto.updatedAt).toBeUndefined();
    dto.touch();
    expect(typeof dto.updatedAt).toBe("number");
  });
});
