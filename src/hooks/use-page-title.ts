import { useEffect } from "react";
import { APP_NAME, TITLE_SEPARATOR, MAX_TITLE_CONTEXT_LENGTH } from "@/lib/constants";

/**
 * Sets the browser tab title. Pass a page-specific context string
 * to display "[context] - Picnic Web", or omit to reset to "Picnic Web".
 */
export function usePageTitle(pageContext?: string): void {
  useEffect(() => {
    if (pageContext) {
      const truncatedContext =
        pageContext.length > MAX_TITLE_CONTEXT_LENGTH
          ? `${pageContext.slice(0, MAX_TITLE_CONTEXT_LENGTH)}…`
          : pageContext;
      document.title = `${truncatedContext}${TITLE_SEPARATOR}${APP_NAME}`;
    } else {
      document.title = APP_NAME;
    }
  }, [pageContext]);
}
