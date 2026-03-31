"use client";

import { useState } from "react";

type AccordionSectionProps = {
  title: string;
  /** Text content rendered with basic markdown bold support. */
  content?: string;
  /** Custom React children rendered instead of text content. */
  children?: React.ReactNode;
};

/** Render text content with basic markdown bold support. */
function renderContent(content: string): React.ReactNode {
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    const boldMatch = part.match(/^\*\*(.+)\*\*$/);
    if (boldMatch) {
      return (
        <strong key={index} className="font-semibold">
          {boldMatch[1]}
        </strong>
      );
    }
    return part;
  });
}

export function AccordionSection({ title, content, children }: AccordionSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border-b border-card-border">
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between py-3 text-left"
        aria-expanded={isExpanded}
      >
        <span className="text-sm font-medium text-foreground">{title}</span>
        <span
          className={`text-gray-400 transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        >
          &#9660;
        </span>
      </button>

      {isExpanded && (
        <div className="pb-4 text-sm text-gray-600">
          {children ?? (
            <p className="whitespace-pre-line">
              {renderContent(content ?? "")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
