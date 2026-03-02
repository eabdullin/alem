"use client";

import { TruncatedOutput } from "@/utils/truncated-output";
import type { ToolDisplayProps } from "../types";

export function FetchToolDisplay({ output, errorText }: ToolDisplayProps) {
  const result = output as
    | { content?: string; url?: string; truncated?: boolean; error?: string }
    | undefined;

  if (!result || typeof result !== "object") {
    return (
      <div className="space-y-2">
        {errorText && (
          <div className="text-amber-700 dark:text-amber-400">{errorText}</div>
        )}
      </div>
    );
  }

  const { content, url, truncated, error } = result;

  return (
    <div className="space-y-2">
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="caption1 text-primary-1 hover:underline break-all"
        >
          {url}
        </a>
      )}
      {error && (
        <div className="text-amber-700 dark:text-amber-400">{error}</div>
      )}
      {content && (
        <div className="rounded-md border bg-muted/30 p-2 font-mono text-xs max-h-48 overflow-y-auto">
          <TruncatedOutput text={content} maxLength={500} />
          {truncated && (
            <div className="mt-1 text-muted-foreground caption1">
              (content truncated)
            </div>
          )}
        </div>
      )}
      {errorText && (
        <div className="rounded bg-destructive/10 px-2 py-1 text-sm text-destructive">
          {errorText}
        </div>
      )}
    </div>
  );
}
