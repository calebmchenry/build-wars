import { utf8Bytes } from "../guide/limits";
export class PersistenceCapacityError extends Error {}
export function assertPersistenceBytes(text: string, limit: number): void {
  if (text.length > limit || utf8Bytes(text) > limit)
    throw new PersistenceCapacityError(
      `Local data exceeds the ${limit / 1024 / 1024} MiB admission limit. Existing data is unchanged.`
    );
}
/** Bound object inputs before recursive legacy validation or serialization. */
export function assertPersistenceStructure(input: unknown): void {
  const stack = [{ value: input, depth: 0 }];
  let count = 0;
  while (stack.length) {
    const { value, depth } = stack.pop()!;
    if (++count > 1000000 || depth > 96)
      throw new PersistenceCapacityError("Local data exceeds structure limits.");
    if (value && typeof value === "object") {
      const values = Array.isArray(value) ? value : Object.values(value);
      for (const child of values) stack.push({ value: child, depth: depth + 1 });
    }
  }
}
