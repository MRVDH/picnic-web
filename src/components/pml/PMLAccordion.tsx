"use client";

import React, { useState } from "react";
import { PMLRenderer } from "./PMLRenderer";

export function PMLAccordion({ component, images }: { component: any; images?: Record<string, string> }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const items = component.items || [];

  return (
    <div className="pml-accordion">
      {items.map((item: any, i: number) => (
        <div key={i} className="pml-accordion__item">
          <div
            className="pml-accordion__header"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            role="button"
            aria-expanded={openIndex === i}
          >
            <PMLRenderer component={item.header} images={images} />
            <svg
              width={20}
              height={20}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#999"
              strokeWidth={2}
              style={{
                transform: openIndex === i ? "rotate(180deg)" : undefined,
                transition: "transform 0.2s",
                flexShrink: 0,
              }}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
          {openIndex === i && (
            <div className="pml-accordion__body">
              <PMLRenderer component={item.body} images={images} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
