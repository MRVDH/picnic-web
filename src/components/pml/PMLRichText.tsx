"use client";

import React from "react";
import { pmlColor, pmlFontWeight, pmlTextSize, pmlDefaultFontWeight } from "@/lib/pml-styles";

/**
 * Resolve the markdown field which can be a plain string or an EXPRESSION object.
 * For expressions, extract the readable text from the fallback (else) branch.
 */
function resolveMarkdown(raw: unknown): string {
  if (typeof raw === "string") return raw;
  if (raw && typeof raw === "object" && (raw as any).type === "EXPRESSION") {
    const expr: string = (raw as any).expression ?? "";
    // Expression format: `condition ? \`...Text...\` : \`...Text...\``
    // Extract text from the else-branch template literal, stripping color markers like #(GREY5)
    const elseMatch = expr.match(/:\s*`([^`]*)`\s*$/);
    if (elseMatch) {
      return elseMatch[1].replace(/#\([^)]*\)/g, "");
    }
    // Fallback: try first template literal
    const anyMatch = expr.match(/`([^`]*)`/);
    if (anyMatch) {
      return anyMatch[1].replace(/#\([^)]*\)/g, "");
    }
  }
  return "";
}

export function PMLRichText({ component }: { component: any }) {
  // Handle RICH_TEXT with children array (inline composition of multiple text spans)
  if (component.children && Array.isArray(component.children)) {
    const attrs = component.textAttributes || {};
    const style: React.CSSProperties = {
      fontSize: attrs.size ? `${pmlTextSize(attrs.size, component.textType)}px` : undefined,
      fontWeight: pmlFontWeight(attrs.weight) ?? pmlDefaultFontWeight(component.textType),
      color: pmlColor(attrs.color),
      textAlign: mapTextAlignment(component.textAlignment),
      lineHeight: 1.4,
      ...(component.numberOfLines && {
        overflow: "hidden",
        display: "-webkit-box",
        WebkitLineClamp: component.numberOfLines,
        WebkitBoxOrient: "vertical" as any,
      }),
    };
    return (
      <div style={style}>
        {component.children.map((child: any, i: number) => (
          <PMLRichText key={i} component={child} />
        ))}
      </div>
    );
  }

  const text = resolveMarkdown(component.markdown);
  if (!text) return null;
  const attrs = component.textAttributes || {};

  // PicnicSymbols font: map special characters to web equivalents
  if (attrs.family === "PicnicSymbols") {
    const symbolMap: Record<string, string> = {
      ">": "›",  // chevron right
      "<": "‹",  // chevron left
    };
    const mapped = symbolMap[text] || text;
    const symStyle: React.CSSProperties = {
      fontSize: `${pmlTextSize(attrs.size, component.textType)}px`,
      fontWeight: pmlFontWeight(attrs.weight) ?? pmlDefaultFontWeight(component.textType),
      color: pmlColor(attrs.color),
      display: "inline",
      lineHeight: 1.4,
    };
    return <span style={symStyle}>{mapped}</span>;
  }

  const style: React.CSSProperties = {
    fontSize: `${pmlTextSize(attrs.size, component.textType)}px`,
    fontWeight: pmlFontWeight(attrs.weight) ?? pmlDefaultFontWeight(component.textType),
    color: pmlColor(attrs.color),
    textAlign: mapTextAlignment(component.textAlignment),
    lineHeight: 1.4,
    display: "inline",
    ...(component.numberOfLines && {
      overflow: "hidden",
      display: "-webkit-box",
      WebkitLineClamp: component.numberOfLines,
      WebkitBoxOrient: "vertical" as any,
    }),
  };

  // Simple markdown rendering: bold, italic, links, line breaks
  const html = renderMarkdown(text);

  return <span style={style} dangerouslySetInnerHTML={{ __html: html }} />;
}

function mapTextAlignment(alignment?: string): React.CSSProperties["textAlign"] {
  switch (alignment) {
    case "LEFT": return "left";
    case "CENTER": return "center";
    case "RIGHT": return "right";
    default: return "left";
  }
}

function renderMarkdown(text: unknown): string {
  if (!text || typeof text !== "string") return "";
  // Split by line breaks (handle both \n literal and actual newlines)
  const normalized = text.replace(/\\n/g, "\n");
  const lines = normalized.split("\n");
  const outputLines: string[] = [];
  let inList: "ul" | "ol" | null = null;

  for (const rawLine of lines) {
    const line = rawLine;

    // Check for headers (# Header)
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      if (inList) { outputLines.push(inList === "ul" ? "</ul>" : "</ol>"); inList = null; }
      const level = headerMatch[1].length;
      outputLines.push(`<h${level} class="pml-markdown-h${level}">${inlineMarkdown(headerMatch[2])}</h${level}>`);
      continue;
    }

    // Check for unordered list items (- item or * item)
    const ulMatch = line.match(/^\s*[-*]\s+(.+)$/);
    if (ulMatch) {
      if (inList !== "ul") {
        if (inList) outputLines.push("</ol>");
        outputLines.push('<ul class="pml-markdown-ul">');
        inList = "ul";
      }
      outputLines.push(`<li>${inlineMarkdown(ulMatch[1])}</li>`);
      continue;
    }

    // Check for ordered list items (1. item)
    const olMatch = line.match(/^\s*\d+\.\s+(.+)$/);
    if (olMatch) {
      if (inList !== "ol") {
        if (inList) outputLines.push("</ul>");
        outputLines.push('<ol class="pml-markdown-ol">');
        inList = "ol";
      }
      outputLines.push(`<li>${inlineMarkdown(olMatch[1])}</li>`);
      continue;
    }

    // Regular line — close any open list
    if (inList) { outputLines.push(inList === "ul" ? "</ul>" : "</ol>"); inList = null; }

    if (line.trim() === "") {
      outputLines.push("<br/>");
    } else {
      outputLines.push(inlineMarkdown(line));
    }
  }

  if (inList) outputLines.push(inList === "ul" ? "</ul>" : "</ol>");

  return outputLines.join("");
}

function inlineMarkdown(text: string): string {
  let result = text;
  // Color tags: #(#hex)text#(#hex) → colored span
  // Apply repeatedly to handle nested tags (innermost first with lazy match)
  let prev = "";
  while (prev !== result) {
    prev = result;
    result = result.replace(/#\(([^)]+)\)((?:(?!#\([^)]*\))[\s\S])*?)#\(\1\)/g, (_, color, content) => {
      if (/^#?[a-fA-F0-9]{3,8}$/.test(color) || /^[a-zA-Z]+$/.test(color)) {
        return `<span style="color:${color}">${content}</span>`;
      }
      return content;
    });
  }
  return result
    // Strip any remaining unmatched color tags
    .replace(/#\([^)]*\)/g, "")
    // Strikethrough
    .replace(/~~(.+?)~~/g, "<del>$1</del>")
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Links [text](url)
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:#e1171e;text-decoration:underline">$1</a>');
}
