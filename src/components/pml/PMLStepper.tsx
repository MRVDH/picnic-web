"use client";

import React from "react";

export function PMLStepper({ component }: { component: any }) {
  const color = component.color || "#e1171e";
  const isMini = component.presentation === "MINI";
  const size = component.height || (isMini ? 32 : 35);
  const radius = component.borderRadius != null ? component.borderRadius : (isMini ? size / 2 : 8);

  // Stepper requires cart state management — render a simple add button for now
  return (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <button
        className="stepper-button"
        style={{
          backgroundColor: color,
          width: size,
          height: size,
          borderRadius: radius,
        }}
        aria-label="Toevoegen"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  );
}
