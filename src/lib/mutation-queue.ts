/**
 * Per-product sequential mutation queue.
 *
 * Each product maintains its own chain of pending mutations. Mutations for the
 * same product execute sequentially (FIFO), while mutations for different
 * products run concurrently. This ensures rapid taps on +/− for one product
 * are processed in order without blocking other products.
 */

export type MutationTask<T> = () => Promise<T>;

type ProductQueue<T> = {
  /** The tail promise in the chain — new tasks chain onto this. */
  tail: Promise<T | void>;
};

/**
 * Create a per-product mutation queue.
 *
 * Returns an `enqueue` function that accepts a product ID and a task (async
 * function). Tasks for the same product run sequentially; tasks for different
 * products run concurrently.
 *
 * The `onSettled` callback fires after each task completes (success or failure),
 * receiving the product ID, the result (or null on failure), and any error.
 */
export function createMutationQueue<T>(
  onSettled: (productId: string, result: T | null, error: unknown) => void,
): {
  enqueue: (productId: string, task: MutationTask<T>) => void;
} {
  const queues = new Map<string, ProductQueue<T>>();

  function enqueue(productId: string, task: MutationTask<T>): void {
    const existing = queues.get(productId);
    const previousTail = existing?.tail ?? Promise.resolve();

    const nextTail = previousTail.then(async () => {
      try {
        const result = await task();
        onSettled(productId, result, null);
        return result;
      } catch (error: unknown) {
        onSettled(productId, null, error);
        // Clear the queue on failure — subsequent queued tasks for this product
        // are stale because we will roll back to the last confirmed state.
        queues.delete(productId);
        return undefined as T | void;
      }
    });

    queues.set(productId, { tail: nextTail });
  }

  return { enqueue };
}
