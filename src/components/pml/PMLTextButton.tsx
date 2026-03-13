"use client";

import React from "react";

export function PMLTextButton({ component }: { component: any }) {
  const isPrimary = component.style === "PRIMARY";

  return (
    <button
      className={`pml-text-button ${isPrimary ? "pml-text-button--primary" : "pml-text-button--secondary"}`}
    >
      {component.title}
    </button>
  );
}
