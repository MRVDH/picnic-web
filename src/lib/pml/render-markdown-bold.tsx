import type { ReactNode } from "react";

/** Render text with basic markdown bold (**text**) support. */
export function renderMarkdownBold(content: string): ReactNode {
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
