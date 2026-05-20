/**
 * Sub-components and helpers for the delivery slot picker.
 *
 * Extracted from delivery-slot-picker.tsx to respect the 300-line
 * constitution limit. All presentational slot-list pieces live here.
 */

"use client";

import { useTranslations } from "@/contexts/country-context";
import type { DeliverySlotData, SlotDayGroup } from "@/lib/delivery-slot-types";
import { formatTime } from "@/lib/format-delivery-window";

// ─── Icons ───────────────────────────────────────────────────────────────────

export function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M5 5l10 10M15 5L5 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LeafIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M13 3s-1 5-5 7C4 12 3 13 3 13s0-5 4-7c1.5-1 3.5-2 6-3Z"
        fill="#22c55e"
        stroke="#16a34a"
        strokeWidth="0.5"
      />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="#22c55e" />
      <path
        d="M6 10l3 3 5-6"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function findSlotInDay(day: SlotDayGroup, slotId: string): DeliverySlotData | null {
  return getAllSlots(day).find((s) => s.slotId === slotId) ?? null;
}

export function getAllSlots(day: SlotDayGroup): DeliverySlotData[] {
  return [...day.greenSlots, ...day.regularSlots];
}

// ─── Day tabs ────────────────────────────────────────────────────────────────

export function DayTabs({
  groups,
  activeIndex,
  onChange,
}: {
  groups: SlotDayGroup[];
  activeIndex: number;
  onChange: (index: number) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-gray-100 px-4 py-2">
      {groups.map((group, idx) => (
        <button
          key={group.date}
          type="button"
          onClick={() => onChange(idx)}
          className={`flex flex-shrink-0 flex-col items-center rounded-lg px-3 py-1.5 text-xs transition-colors ${
            idx === activeIndex
              ? "bg-picnic-red text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <span className="font-medium">{group.dayLabel}</span>
          <span className="opacity-75">{group.dateLabel}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Section header ──────────────────────────────────────────────────────────

export function SectionHeader({ text, icon }: { text: string; icon?: "leaf" }) {
  return (
    <div className="mt-4 mb-2 flex items-center gap-1.5">
      {icon === "leaf" && <LeafIcon />}
      <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase">{text}</span>
    </div>
  );
}

// ─── Slot row ────────────────────────────────────────────────────────────────

export function SlotRow({
  slot,
  isSelecting,
  isDisabled,
  isCurrentlySelected,
  onSelect,
}: {
  slot: DeliverySlotData;
  isSelecting: boolean;
  isDisabled: boolean;
  isCurrentlySelected: boolean;
  onSelect: (slotId: string) => void;
}) {
  const startTime = formatTime(new Date(slot.windowStart));
  const endTime = formatTime(new Date(slot.windowEnd));

  return (
    <button
      type="button"
      onClick={() => onSelect(slot.slotId)}
      disabled={isDisabled || !slot.isAvailable}
      className={`mb-1.5 flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
        isCurrentlySelected
          ? "border-green-500 bg-green-50"
          : "border-gray-200 bg-white hover:bg-gray-50"
      } ${isDisabled || !slot.isAvailable ? "opacity-50" : ""}`}
    >
      <div className="flex items-center gap-2">
        {slot.isGreenChoice && <LeafIcon />}
        <span className="text-foreground text-sm font-medium">
          {startTime} - {endTime}
        </span>
      </div>

      <div className="flex items-center">
        {isSelecting && (
          <div className="border-t-picnic-red h-4 w-4 animate-spin rounded-full border-2 border-gray-300" />
        )}
        {isCurrentlySelected && !isSelecting && <CheckIcon />}
      </div>
    </button>
  );
}

// ─── Grouping views ──────────────────────────────────────────────────────────

export function SelectedDayView({
  selectedSlot,
  otherSlots,
  selectingSlotId,
  onSelectSlot,
}: {
  selectedSlot: DeliverySlotData;
  otherSlots: DeliverySlotData[];
  selectingSlotId: string | null;
  onSelectSlot: (slotId: string) => void;
}) {
  const t = useTranslations();
  return (
    <>
      <SectionHeader text={t.selectedSectionLabel} />
      <SlotRow
        slot={selectedSlot}
        isSelecting={selectingSlotId === selectedSlot.slotId}
        isDisabled={selectingSlotId !== null}
        isCurrentlySelected
        onSelect={onSelectSlot}
      />
      {otherSlots.length > 0 && (
        <>
          <SectionHeader text={t.otherMomentLabel} />
          {otherSlots.map((slot) => (
            <SlotRow
              key={slot.slotId}
              slot={slot}
              isSelecting={selectingSlotId === slot.slotId}
              isDisabled={selectingSlotId !== null}
              isCurrentlySelected={false}
              onSelect={onSelectSlot}
            />
          ))}
        </>
      )}
    </>
  );
}

export function DefaultDayView({
  day,
  selectingSlotId,
  onSelectSlot,
}: {
  day: SlotDayGroup;
  selectingSlotId: string | null;
  onSelectSlot: (slotId: string) => void;
}) {
  const t = useTranslations();
  return (
    <>
      {day.greenSlots.length > 0 && (
        <>
          <SectionHeader text={t.greenChoiceLabel} icon="leaf" />
          {day.greenSlots.map((slot) => (
            <SlotRow
              key={slot.slotId}
              slot={slot}
              isSelecting={selectingSlotId === slot.slotId}
              isDisabled={selectingSlotId !== null}
              isCurrentlySelected={false}
              onSelect={onSelectSlot}
            />
          ))}
        </>
      )}
      {day.regularSlots.length > 0 && (
        <>
          <SectionHeader text={t.otherMomentLabel} />
          {day.regularSlots.map((slot) => (
            <SlotRow
              key={slot.slotId}
              slot={slot}
              isSelecting={selectingSlotId === slot.slotId}
              isDisabled={selectingSlotId !== null}
              isCurrentlySelected={false}
              onSelect={onSelectSlot}
            />
          ))}
        </>
      )}
    </>
  );
}
