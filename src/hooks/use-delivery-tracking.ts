"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useCountryCode } from "@/contexts/country-context";
import type { DeliveryTrackingData } from "@/lib/core/delivery-types";
import { parseDeliveryTracking } from "@/lib/delivery/parse-delivery-tracking";
import { TOKEN_EXPIRED_REDIRECT } from "@/lib/core/constants";
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

export function useDeliveryTracking({
  deliveryId,
  enabled,
}: UseDeliveryTrackingOptions): UseDeliveryTrackingResult {
  const countryCode = useCountryCode();
  const [tracking, setTracking] = useState<TrackingState>({ status: "loading" });
  const scenarioRef = useRef<unknown>(null);
  const scenarioVersionRef = useRef<number>(-1);
  const intervalRef = useRef<number>(15000);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pollGeneration, setPollGeneration] = useState(0);

  const fetchScenario = useCallback(async (): Promise<boolean> => {
    const res = await fetch(`/api/deliveries/${encodeURIComponent(deliveryId)}/scenario`);
    const data = (await res.json()) as unknown & Partial<ApiErrorResponse>;
    if ("error" in data && data.error) {
      if (data.code === "TOKEN_EXPIRED") {
        window.location.href = TOKEN_EXPIRED_REDIRECT;
        return false;
      }
      return false;
    }
    scenarioRef.current = data;
    return true;
  }, [deliveryId]);

  const pollPosition = useCallback(async () => {
    if (!enabled) return;

    try {
      const res = await fetch(`/api/deliveries/${encodeURIComponent(deliveryId)}/position`);
      const position = (await res.json()) as unknown & Partial<ApiErrorResponse>;

      if ("error" in position && position.error) {
        if (position.code === "TOKEN_EXPIRED") {
          window.location.href = TOKEN_EXPIRED_REDIRECT;
          return;
        }
        setTracking({ status: "error" });
        return;
      }

      const positionVersion =
        typeof position === "object" &&
        position !== null &&
        "version" in position &&
        typeof (position as { version: unknown }).version === "number"
          ? (position as { version: number }).version
          : -1;

      if (scenarioRef.current === null || positionVersion !== scenarioVersionRef.current) {
        const ok = await fetchScenario();
        if (!ok && scenarioRef.current === null) {
          setTracking({ status: "error" });
          return;
        }
        scenarioVersionRef.current = positionVersion;
      }

      const parsed = parseDeliveryTracking(position, scenarioRef.current, countryCode);
      intervalRef.current = parsed.queryInterval;
      setTracking({ status: "ready", data: parsed });
    } catch {
      setTracking({ status: "error" });
    }
  }, [countryCode, deliveryId, enabled, fetchScenario]);

  const refetch = useCallback(() => {
    scenarioRef.current = null;
    scenarioVersionRef.current = -1;
    setTracking({ status: "loading" });
    setPollGeneration((g) => g + 1);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const initialTimer = setTimeout(() => {
      void pollPosition();
    }, 0);

    return () => {
      clearTimeout(initialTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, pollPosition, pollGeneration]);

  useEffect(() => {
    if (!enabled || tracking.status !== "ready" || !tracking.data.scenarioInProgress) return;

    timerRef.current = setTimeout(() => {
      void pollPosition();
    }, intervalRef.current);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, tracking, pollPosition]);

  if (!enabled) {
    return { tracking: { status: "idle" }, refetch };
  }

  return { tracking, refetch };
}
