"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import {
  CommitFile,
  CommitFileAdditions,
  CommitFileChanges,
  CommitFileDeletions,
  CommitFileIcon,
  CommitFilePath,
  CommitFiles,
} from "@/components/ai-elements/commit";
import type { ToolDisplayProps } from "../types";
import type { FilePatchResult } from "@/shared/tools/file-patch/types";

const DIFF_PREVIEW_LINE_LIMIT = 4;

interface PatchFileStats {
  path: string;
  additions: number;
  deletions: number;
}

function parsePatchForPreview(patch: string): PatchFileStats[] {
  const lines = patch.split(/\r?\n/);
  const result: PatchFileStats[] = [];
  let currentPath: string | null = null;
  let currentAdditions = 0;
  let currentDeletions = 0;

  for (const line of lines) {
    if (line.startsWith("+++ ")) {
      if (currentPath !== null) {
        result.push({
          path: currentPath,
          additions: currentAdditions,
          deletions: currentDeletions,
        });
      }
      const pathPart = line.slice(4).trim();
      currentPath = pathPart.replace(/^[ab]\//, "") || pathPart;
      currentAdditions = 0;
      currentDeletions = 0;
    } else if (currentPath !== null) {
      if (line.startsWith("+") && !line.startsWith("+++"))
        currentAdditions++;
      else if (line.startsWith("-") && !line.startsWith("---"))
        currentDeletions++;
    }
  }
  if (currentPath !== null) {
    result.push({
      path: currentPath,
      additions: currentAdditions,
      deletions: currentDeletions,
    });
  }
  return result;
}

export function getConfirmationPreview(input: unknown): ReactNode {
  if (input != null && typeof input === "object" && "patch" in input) {
    const patch = (input as { patch?: string }).patch;
    if (typeof patch === "string" && patch.trim()) {
      const stats = parsePatchForPreview(patch);
      if (stats.length > 0) {
        return (
          <span className="text-sm">
            Allow to change these files{" "}
            {stats.map((s, i) => (
              <span key={s.path}>
                {i > 0 && ", "}
                <code className="rounded bg-muted px-1 font-mono text-xs">
                  {s.path}
                </code>
                <span className="text-muted-foreground">
                  {" "}
                  (+{s.additions}/-{s.deletions})
                </span>
              </span>
            ))}
            ?
          </span>
        );
      }
    }
  }
  return null;
}

function DiffLine({ line, i }: { line: string; i: number }) {
  if (line.startsWith("+")) {
    return (
      <div key={i} className="bg-green-500/10 text-green-700 dark:text-green-400">
        {line}
      </div>
    );
  }
  if (line.startsWith("-")) {
    return (
      <div key={i} className="bg-red-500/10 text-red-700 dark:text-red-400">
        {line}
      </div>
    );
  }
  return (
    <div key={i} className="text-muted-foreground">
      {line}
    </div>
  );
}

function DiffPreview({ patch }: { patch: string }) {
  const [expanded, setExpanded] = useState(false);
  const lines = patch.split(/\r?\n/);
  const isLong = lines.length > DIFF_PREVIEW_LINE_LIMIT;
  const visibleLines = expanded ? lines : lines.slice(0, DIFF_PREVIEW_LINE_LIMIT);
  const hiddenCount = lines.length - DIFF_PREVIEW_LINE_LIMIT;

  return (
    <div>
      <pre className="overflow-x-auto rounded border bg-muted/30 p-2 font-mono text-xs">
        {visibleLines.map((line, i) => (
          <DiffLine key={i} line={line} i={i} />
        ))}
      </pre>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-1 text-xs font-medium text-muted-foreground hover:text-foreground underline underline-offset-2"
        >
          {expanded ? "Show less" : `Show more (${hiddenCount} lines)`}
        </button>
      )}
    </div>
  );
}

export function FilePatchToolDisplay({
  input,
  output,
  errorText,
}: ToolDisplayProps) {
  const result = output as FilePatchResult | undefined;
  const patchInput =
    input && typeof input === "object" && "patch" in input
      ? (input as { patch?: string }).patch
      : "";
  const hasResult = result && typeof result === "object";

  if (!hasResult) {
    return (
      <div className="space-y-2 rounded-md border bg-muted/30 p-2 font-mono text-xs">
        {errorText ? (
          <div className="text-amber-700 dark:text-amber-400">{errorText}</div>
        ) : (
          <div className="text-muted-foreground">
            Pending approval or no output yet.
          </div>
        )}
      </div>
    );
  }

  const { files_changed, rejected_ops, diff_preview, status } = result;

  const hasChanges = files_changed.length > 0 || rejected_ops.length > 0;
  const totalAdditions = diff_preview?.reduce((a, f) => a + f.additions, 0) ?? 0;
  const totalDeletions =
    diff_preview?.reduce((a, f) => a + f.deletions, 0) ?? 0;

  return (
    <div className="space-y-3">
      {hasChanges && (
        <div className="space-y-2">
          <div className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
            Changed files
          </div>
          <CommitFiles>
            {diff_preview?.map((f) => (
              <CommitFile key={f.path}>
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <CommitFileIcon />
                  <CommitFilePath>{f.path}</CommitFilePath>
                </div>
                <CommitFileChanges>
                  <CommitFileAdditions count={f.additions} />
                  <CommitFileDeletions count={f.deletions} />
                </CommitFileChanges>
              </CommitFile>
            ))}
          </CommitFiles>
          {files_changed.length > 0 && (
            <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <span className="text-green-600 dark:text-green-400">
                +{totalAdditions}
              </span>
              <span className="text-red-600 dark:text-red-400">
                -{totalDeletions}
              </span>
            </div>
          )}
          {rejected_ops.length > 0 && (
            <div className="space-y-1">
              <div className="font-medium text-amber-700 dark:text-amber-400 text-xs">
                Rejected
              </div>
              <ul className="list-inside list-disc space-y-0.5 text-xs text-amber-700 dark:text-amber-400">
                {rejected_ops.map((r) => (
                  <li key={r.path}>
                    <span className="font-mono">{r.path}</span>: {r.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {patchInput && (
        <div className="space-y-1">
          <div className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
            Diff preview
          </div>
          <DiffPreview patch={patchInput} />
        </div>
      )}

      {status === "error" && !hasChanges && (
        <div className="rounded bg-destructive/10 px-2 py-1 text-sm text-destructive">
          {rejected_ops[0]?.reason ?? "Patch could not be applied."}
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
