export function parseLogValue<T = string>(
  value: unknown,
  parser: (v: string | number | bigint) => T = v => v as unknown as T
): T {
  if (typeof value === "string" || typeof value === "number" || typeof value === "bigint") {
    return parser(value)
  }
  throw new Error("Invalid log value type")
}

export function parseBigInt(value: unknown): bigint {
  return parseLogValue(value, v => BigInt(v))
}

export function parseNumber(value: unknown): number {
  return parseLogValue(value, v => Number(v))
}

export function parseHex(value: unknown): `0x${string}` {
  return parseLogValue(value, v => {
    const str = String(v)
    if (str.startsWith("0x")) return str as `0x${string}`
    throw new Error("Invalid hex format")
  })
}
