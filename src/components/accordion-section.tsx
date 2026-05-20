"use client";

import { useState } from "react";

import { renderMarkdownBold } from "@/lib/render-markdown-bold";

type AccordionSectionProps = {
  title: string;
  /** Text content rendered with basic markdown bold support. */
  content?: string;
  /** Custom React children rendered instead of text content. */
  children?: React.ReactNode;
};

export function AccordionSection({ title, content, children }: AccordionSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border-card-border border-b">
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between py-3 text-left"
        aria-expanded={isExpanded}
      >
        <span className="text-foreground text-sm font-medium">{title}</span>
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
          {children ?? <p className="whitespace-pre-line">{renderMarkdownBold(content ?? "")}</p>}
        </div>
      )}
    </div>
  );
}
