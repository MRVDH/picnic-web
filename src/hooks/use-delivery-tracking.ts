"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { TOKEN_EXPIRED_REDIRECT } from "@/lib/core/constants";
import type { DeliveryTrackingData } from "@/lib/core/delivery-types";
import type { ApiErrorResponse } from "@/lib/core/types";

type TrackingState =
  | { status: "loading" }
  | { status: "ready"; data: DeliveryTrackingData }
  | { status: "error" };

type UseDeliveryTrackingOptions = {
  deliveryId: string;
  enabled: boolean;
};

type UseDeliveryTrackingResult = {
  tracking: TrackingState | { status: "idle" };
  refetch: () => void;
};

/**
 * Polls where a delivery is (/api/deliveries/[id]/tracking) while the driver is
 * on the way, at the interval Picnic asks for.
 */
export function useDeliveryTracking({
  deliveryId,
  enabled,
}: UseDeliveryTrackingOptions): UseDeliveryTrackingResult {
  const [tracking, setTracking] = useState<TrackingState>({ status: "loading" });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pollGeneration, setPollGeneration] = useState(0);

  const poll = useCallback(async () => {
    if (!enabled) return;

    try {
      const res = await fetch(`/api/deliveries/${encodeURIComponent(deliveryId)}/tracking`);
      const data = (await res.json()) as DeliveryTrackingData & Partial<ApiErrorResponse>;

      if ("error" in data && data.error) {
        if (data.code === "TOKEN_EXPIRED") {
          window.location.href = TOKEN_EXPIRED_REDIRECT;
          return;
        }
        setTracking({ status: "error" });
        return;
      }

      setTracking({ status: "ready", data });
    } catch {
      setTracking({ status: "error" });
    }
  }, [deliveryId, enabled]);

  const refetch = useCallback(() => {
    setTracking({ status: "loading" });
    setPollGeneration((g) => g + 1);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const initialTimer = setTimeout(() => {
      void poll();
    }, 0);

    return () => {
      clearTimeout(initialTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, poll, pollGeneration]);

  useEffect(() => {
    if (!enabled || tracking.status !== "ready" || !tracking.data.scenarioInProgress) return;

    timerRef.current = setTimeout(() => {
      void poll();
    }, tracking.data.queryInterval);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, tracking, poll]);

  if (!enabled) {
    return { tracking: { status: "idle" }, refetch };
  }

  return { tracking, refetch };
}
