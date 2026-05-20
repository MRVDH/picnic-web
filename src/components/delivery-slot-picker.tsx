/**
 * Delivery slot picker modal.
 *
 * Opens as a centered modal over a dimmed backdrop. Fetches fresh slot data
 * on every open, displays day tabs with slot grouping, and handles slot
 * selection with blocking confirmation from the API.
 */

"use client";

import { useCallback, useEffect, useState } from "react";

import {
  CloseIcon,
  DayTabs,
  DefaultDayView,
  SelectedDayView,
  findSlotInDay,
  getAllSlots,
} from "@/components/slot-picker-parts";
import { useTranslations } from "@/contexts/country-context";
import type { DeliverySlotPickerData } from "@/lib/delivery-slot-types";
import type { ApiErrorResponse, CartData } from "@/lib/types";

// ─── Props & state ───────────────────────────────────────────────────────────

type DeliverySlotPickerProps = {
  onClose: () => void;
  onSlotSelected: (updatedCart: CartData) => void;
};

type PickerState =
  | { status: "loading" }
  | { status: "ready"; data: DeliverySlotPickerData; dayIndex: number; selectionError?: string }
  | { status: "selecting"; data: DeliverySlotPickerData; dayIndex: number; slotId: string }
  | { status: "error"; message: string };

// ─── API helpers ─────────────────────────────────────────────────────────────

async function fetchSlots(): Promise<DeliverySlotPickerData> {
  const res = await fetch("/api/cart/delivery-slots");
  const data: DeliverySlotPickerData | ApiErrorResponse = await res.json();
  if ("error" in data) throw new Error(data.error);
  return data;
}

async function selectSlot(slotId: string): Promise<CartData> {
  const res = await fetch("/api/cart/delivery-slots", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slotId }),
  });
  const data: CartData | ApiErrorResponse = await res.json();
  if ("error" in data) throw new Error(data.error);
  return data;
}

// ─── Main component ──────────────────────────────────────────────────────────

export function DeliverySlotPicker({ onClose, onSlotSelected }: DeliverySlotPickerProps) {
  const [state, setState] = useState<PickerState>({ status: "loading" });

  // Fetch fresh slot data on mount (component is only mounted when picker is open)
  useEffect(() => {
    let cancelled = false;
    fetchSlots()
      .then((data) => {
        if (cancelled) return;
        setState({ status: "ready", data, dayIndex: 0 });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({ status: "error", message: err.message });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSelectSlot = useCallback(
    (slotId: string) => {
      setState((prev) => {
        if (prev.status !== "ready") return prev;
        return { ...prev, status: "selecting", slotId };
      });

      selectSlot(slotId)
        .then((cart) => onSlotSelected(cart))
        .catch((err) => {
          // Retain previous data and dayIndex — show inline error instead of full error view
          setState((prev) => {
            if (prev.status === "selecting") {
              return {
                status: "ready",
                data: prev.data,
                dayIndex: prev.dayIndex,
                selectionError: err.message,
              };
            }
            return prev;
          });
        });
    },
    [onSlotSelected]
  );

  const handleDayChange = useCallback((index: number) => {
    setState((prev) => {
      if (prev.status === "ready" || prev.status === "selecting") {
        return { ...prev, status: "ready", dayIndex: index, selectionError: undefined };
      }
      return prev;
    });
  }, []);

  const handleRetry = useCallback(() => {
    setState({ status: "loading" });
    fetchSlots()
      .then((data) => setState({ status: "ready", data, dayIndex: 0 }))
      .catch((err) => setState({ status: "error", message: err.message }));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[min(600px,90vh)] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <PickerHeader onClose={onClose} />

        {state.status === "loading" && <LoadingBody />}
        {state.status === "error" && <ErrorBody message={state.message} onRetry={handleRetry} />}
        {(state.status === "ready" || state.status === "selecting") && (
          <SlotListBody
            data={state.data}
            dayIndex={state.dayIndex}
            selectingSlotId={state.status === "selecting" ? state.slotId : null}
            selectionError={state.status === "ready" ? state.selectionError : undefined}
            onDayChange={handleDayChange}
            onSelectSlot={handleSelectSlot}
          />
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function PickerHeader({ onClose }: { onClose: () => void }) {
  const t = useTranslations();
  return (
    <div className="border-b border-gray-200 px-4 pt-4 pb-3">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-foreground text-lg font-bold">{t.pickerTitle}</h2>
          <p className="text-sm text-green-700">{t.freeDeliveryLabel}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
          aria-label={t.closeAriaLabel}
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}

function LoadingBody() {
  return (
    <div className="flex min-h-[200px] flex-1 items-center justify-center">
      <div className="border-t-picnic-red h-8 w-8 animate-spin rounded-full border-4 border-gray-200" />
    </div>
  );
}

function ErrorBody({ message, onRetry }: { message: string; onRetry: () => void }) {
  const t = useTranslations();
  return (
    <div className="flex min-h-[200px] flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-sm text-gray-600">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="bg-picnic-red rounded-lg px-4 py-2 text-sm font-medium text-white"
      >
        {t.retryLabel}
      </button>
    </div>
  );
}

function SlotListBody({
  data,
  dayIndex,
  selectingSlotId,
  selectionError,
  onDayChange,
  onSelectSlot,
}: {
  data: DeliverySlotPickerData;
  dayIndex: number;
  selectingSlotId: string | null;
  selectionError?: string;
  onDayChange: (index: number) => void;
  onSelectSlot: (slotId: string) => void;
}) {
  const t = useTranslations();

  if (data.dayGroups.length === 0) {
    return (
      <div className="flex min-h-[200px] flex-1 items-center justify-center px-6 text-center">
        <p className="text-sm text-gray-500">{t.noSlotsLabel}</p>
      </div>
    );
  }

  const currentDay = data.dayGroups[dayIndex];
  const selectedOnThisDay = data.selectedSlot
    ? findSlotInDay(currentDay, data.selectedSlot.slotId)
    : null;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <DayTabs groups={data.dayGroups} activeIndex={dayIndex} onChange={onDayChange} />
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {selectionError && (
          <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {selectionError}
          </div>
        )}
        {selectedOnThisDay ? (
          <SelectedDayView
            selectedSlot={selectedOnThisDay}
            otherSlots={getAllSlots(currentDay).filter(
              (s) => s.slotId !== selectedOnThisDay.slotId
            )}
            selectingSlotId={selectingSlotId}
            onSelectSlot={onSelectSlot}
          />
        ) : (
          <DefaultDayView
            day={currentDay}
            selectingSlotId={selectingSlotId}
            onSelectSlot={onSelectSlot}
          />
        )}
      </div>
    </div>
  );
}
