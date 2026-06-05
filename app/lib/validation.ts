import { z } from 'zod';

/**
 * Validate URLSearchParams against a Zod schema.
 * Returns the parsed object if validation succeeds; throws a ZodError otherwise.
 */
export function validateParams<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  searchParams: URLSearchParams
): z.infer<typeof schema> {
  // Convert searchParams into a plain object (string values only)
  const rawObj = Object.fromEntries(searchParams.entries());
  // Zod will coerce types according to the schema (e.g., z.coerce.number())
  return schema.parse(rawObj);
}
