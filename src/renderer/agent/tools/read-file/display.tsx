"use client";

import { TruncatedOutput } from "@/utils/truncated-output";
import type { ToolDisplayProps } from "../types";
import type { ReadFileResult } from "@/shared/tools/read-file/types";

const FORMAT_LABELS: Record<string, string> = {
  text: "Text",
  pdf: "PDF",
  docx: "DOCX",
  rtf: "RTF",
  unknown: "File",
};

export function ReadFileToolDisplay({
  input,
  output,
  errorText,
}: ToolDisplayProps) {
  const result = output as ReadFileResult | undefined;
  const filePath =
    input && typeof input === "object" && "path" in input
      ? (input as { path?: string }).path
      : "";

  if (!result || typeof result !== "object") {
    return (
      <div className="space-y-2">
        {errorText && (
          <div className="text-amber-700 dark:text-amber-400">{errorText}</div>
        )}
      </div>
    );
  }

  const { content, path: resolvedPath, truncated, format, error } = result;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
          {resolvedPath || filePath || "(unknown file)"}
        </code>
        <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
          {FORMAT_LABELS[format] ?? format.toUpperCase()}
        </span>
        {truncated && (
          <span className="text-amber-600 dark:text-amber-500">truncated</span>
        )}
      </div>

      {error && (
        <div className="rounded bg-destructive/10 px-2 py-1 text-sm text-destructive">
          {error}
        </div>
      )}

      {content && (
        <div className="rounded-md border bg-muted/30 p-2 font-mono text-xs max-h-48 overflow-y-auto">
          <TruncatedOutput text={content} maxLength={500} />
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
