/**
 * Resolve `worker` over `items`, at most `limit` at a time, preserving order.
 *
 * Every Picnic call made for one user action shares the same upstream rate
 * limit, so fan-out has to be capped rather than left to `Promise.all`. A meal
 * plan's shopping list asks for one recipe page plus one product page per
 * ingredient; unbounded, a seven-day plan opens well over fifty connections at
 * once, and the throttling that follows reaches the user as a failed action.
 *
 * Order is preserved by writing each result back to its own index, so callers
 * can still pair results with their inputs.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  worker: (item: T) => Promise<R>,
  limit: number
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function run(): Promise<void> {
    while (next < items.length) {
      const index = next++;
      results[index] = await worker(items[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}
