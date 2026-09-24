"use client";

import { useCallback, useEffect, useState } from "react";

import { TOKEN_EXPIRED_REDIRECT } from "@/lib/core/constants";
import type { ApiErrorResponse } from "@/lib/core/types";

export type ApiResourceState<T> =
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; message: string };

/**
 * Fetch a same-origin `/api/*` route that follows the API route contract:
 * `{ error, code: "TOKEN_EXPIRED" }` redirects to login, other errors become
 * an error state with the route's message. `fallbackError` is shown when the
 * request itself fails. `retry` refetches.
 */
export function useApiResource<T>(url: string, fallbackError: string) {
  const [state, setState] = useState<ApiResourceState<T>>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    fetch(url, { signal: controller.signal })
      .then((res) => res.json())
      .then((data: T & Partial<ApiErrorResponse>) => {
        if (data.error) {
          if (data.code === "TOKEN_EXPIRED") {
            window.location.href = TOKEN_EXPIRED_REDIRECT;
            return;
          }
          setState({ status: "error", message: data.error });
          return;
        }
        setState({ status: "success", data });
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setState({ status: "error", message: fallbackError });
      });

    return () => controller.abort();
  }, [url, attempt, fallbackError]);

  const retry = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  return { state, retry };
}
