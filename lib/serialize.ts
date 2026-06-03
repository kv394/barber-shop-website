/**
 * Lightweight serialization for passing Prisma objects to Client Components.
 * Converts Date → ISO string, BigInt → string, Decimal → number.
 * Much faster than JSON.parse(JSON.stringify(...)) for typical payloads.
 *
 * Returns `any` because the output type differs from input (Date→string, etc).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serialize(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj.toISOString();
  if (typeof obj === 'bigint') return obj.toString();
  // Prisma Decimal type
  if (typeof obj === 'object' && 'toNumber' in obj) {
    return obj.toNumber();
  }
  if (Array.isArray(obj)) return obj.map(serialize);
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(obj)) {
      result[key] = serialize(obj[key]);
    }
    return result;
  }
  return obj;
}
