"use client";

import React from "react";

export function PMLStepper({ component }: { component: any }) {
  // Stepper requires cart state management — render a simple add button for now
  return (
    <button
      className="stepper-button"
      aria-label="Toevoegen"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    </button>
  );
}
