/** Runtime type guard: true if val is a non-null, non-array object. */
export function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

/** Runtime type guard: true if val is an array. */
export function isArray(val: unknown): val is unknown[] {
  return Array.isArray(val);
}

/** Coerce val to string, returning fallback if not a string. */
export function asString(val: unknown, fallback = ""): string {
  return typeof val === "string" ? val : fallback;
}

/** Coerce val to number, returning fallback if not a finite number. */
export function asNumber(val: unknown, fallback = 0): number {
  return typeof val === "number" && isFinite(val) ? val : fallback;
}

/** Coerce val to array, returning empty array if not an array. */
export function asArray(val: unknown): unknown[] {
  return isArray(val) ? val : [];
}
