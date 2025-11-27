/**
 * @file companyDTO.test.ts
 * @description Unit tests for CompanyDTO
 */

import CompanyDTO from "../companyDTO";

describe("CompanyDTO", () => {
  const validBase = {
    name: "Acme Ltd",
    address: "123 Main Street",
    city: "New York",
    stateOrProvince: "NY",
    postalCode: "10001",
    country: "USA",
    email: "info@acme.com",
  };

  it("should create a valid DTO", () => {
    const dto = new CompanyDTO(validBase);

    expect(dto.name).toBe("Acme Ltd");
    expect(dto.address).toBe("123 Main Street");
    expect(dto.city).toBe("New York");
    expect(dto.verified).toBe(false);
  });

  // ---------- Required Fields Validation ----------
  const requiredFields = [
    "name",
    "address",
    "city",
    "stateOrProvince",
    "postalCode",
    "country",
    "email",
  ] as const;

  for (const field of requiredFields) {
    it(`should throw if ${field} is missing`, () => {
      const data = { ...validBase };
      // delete required field
      delete (data as any)[field];

      const dto = new CompanyDTO(data as any);

      expect(() => dto.validate()).toThrow(`${field} required`);
    });
  }

  // ---------- toJSON Tests ----------
  it("should convert DTO to JSON with default verified=false", () => {
    const dto = new CompanyDTO(validBase);
    const json = dto.toJSON();

    expect(json.name).toBe(validBase.name);
    expect(json.verified).toBe(false);
    expect(typeof json.createdAt).toBe("number");
  });

  it("should keep provided verified=true", () => {
    const dto = new CompanyDTO({
      ...validBase,
      verified: true,
    });

    const json = dto.toJSON();
    expect(json.verified).toBe(true);
  });

  it("should include optional fields when provided", () => {
    const dto = new CompanyDTO({
      ...validBase,
      phone: "123456",
      taxId: "TAX-001",
      registrationNumber: "REG-555",
      businessType: "Manufacturing",
      website: "https://acme.com",
      walletAddress: "0xabc123",
      updatedAt: 999999,
    });

    const json = dto.toJSON();

    expect(json.phone).toBe("123456");
    expect(json.taxId).toBe("TAX-001");
    expect(json.registrationNumber).toBe("REG-555");
    expect(json.businessType).toBe("Manufacturing");
    expect(json.website).toBe("https://acme.com");
    expect(json.walletAddress).toBe("0xabc123");
    expect(json.updatedAt).toBe(999999);
  });
});
