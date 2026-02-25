"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";

/** Default max characters shown before collapsing; user can expand to see full output */
export const OUTPUT_PREVIEW_LIMIT = 100;

export function TruncatedOutput({
  text,
  className,
  maxLength = OUTPUT_PREVIEW_LIMIT,
  render,
}: {
  text: string;
  className?: string;
  maxLength?: number;
  /** Custom renderer for content (e.g. Streamdown). When omitted, renders plain text in <pre>. */
  render?: (content: string) => ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > maxLength;
  const preview = isLong ? text.slice(0, maxLength) : text;
  const remainder = isLong ? text.slice(maxLength) : "";
  const content = expanded ? text : preview;

  return (
    <div>
      {render ? (
        <div className={cn("[&>*:first-child]:mt-0 [&>*:last-child]:mb-0", className)}>
          {render(content)}
        </div>
      ) : (
        <pre className={cn("whitespace-pre-wrap break-words", className)}>{content}</pre>
      )}
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-1 text-xs font-medium text-muted-foreground hover:text-foreground underline underline-offset-2"
        >
          {expanded ? "Show less" : `Show more (${remainder.length} chars)`}
        </button>
      )}
    </div>
  );
}
