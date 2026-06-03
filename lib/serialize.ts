/**
 * Lightweight serialization for passing Prisma objects to Client Components.
 * Converts Date → ISO string, BigInt → string, Decimal → number.
 * Much faster than JSON.parse(JSON.stringify(...)) for typical payloads.
 */
export function serialize<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj.toISOString() as unknown as T;
  if (typeof obj === 'bigint') return obj.toString() as unknown as T;
  // Prisma Decimal type
  if (typeof obj === 'object' && 'toNumber' in (obj as any)) {
    return (obj as any).toNumber() as unknown as T;
  }
  if (Array.isArray(obj)) return obj.map(serialize) as unknown as T;
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(obj as Record<string, unknown>)) {
      result[key] = serialize((obj as Record<string, unknown>)[key]);
    }
    return result as T;
  }
  return obj;
}
