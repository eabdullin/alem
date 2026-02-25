"use client";

import type { ReactNode } from "react";
import { TruncatedOutput } from "@/utils/truncated-output";
import { extractBrowserHosts } from "@/services/tool-approval-service";
import type { ToolDisplayProps } from "../types";
import type { BrowserActionResult, BrowserAction } from "@/shared/tools/browser/types";

export function getConfirmationPreview(input: unknown): ReactNode {
  if (input != null && typeof input === "object" && "actions" in input) {
    const actions = (input as { actions: BrowserAction[] }).actions;
    if (Array.isArray(actions) && actions.length > 0) {
      const labels = actions.map((a) => formatAction(a));
      const hosts = extractBrowserHosts(input);
      const hostHint =
        hosts.length > 0 ? (
          <span className="text-muted-foreground">
            {" "}
            (website: {hosts.join(", ")})
          </span>
        ) : null;
      return (
        <span className="text-sm">
          Allow to do following actions in the browser:{" "}
          <code className="rounded bg-muted px-1 font-mono text-xs">
            {labels.join(" → ")}
          </code>
          {hostHint}?
        </span>
      );
    }
  }
  return null;
}

export function formatAction(action: BrowserAction): string {
  switch (action.action) {
    case "open":
      return action.url ? `Open ${action.url}` : "Open browser";
    case "navigate":
      return `Navigate to ${action.url}`;
    case "click_at":
      return `Click at (${action.x}, ${action.y})`;
    case "type":
      return `Type "${action.text}"`;
    case "press":
      return `Press ${action.key}`;
    case "scroll":
      return `Scroll ${action.direction}`;
    case "wait":
      return `Wait ${action.seconds}s`;
    case "close":
      return "Close browser";
    default:
      return "Browser action";
  }
}

export function BrowserToolDisplay({
  input,
  output,
  errorText,
}: ToolDisplayProps) {
  const result = output as BrowserActionResult | undefined;
  const actions =
    input && typeof input === "object" && "actions" in input
      ? (input as { actions: BrowserAction[] }).actions
      : [];

  const hasResult = result && typeof result === "object";
  if (!hasResult) {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
            {actions.map((a, i) => (
                formatAction(a) + (i !== actions.length - 1 ? " → " : "")
            ))}
          </code>
        </div>
        <div className="space-y-2 rounded-md border bg-muted/30 p-2 font-mono text-xs">
          {errorText ? (
            <div className="text-amber-700 dark:text-amber-400">{errorText}</div>
          ) : (
            <div className="text-muted-foreground">
              Pending approval or no output yet.
            </div>
          )}
        </div>
      </div>
    );
  }

  const isOk = result.ok === true;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
            {actions.map((a, i) => (
                formatAction(a) + " → "
            ))}
        </code>
        <span
          className={
            isOk
              ? "rounded bg-green-500/20 px-1.5 py-0.5 font-medium text-green-700 dark:text-green-400"
              : "rounded bg-red-500/20 px-1.5 py-0.5 font-medium text-red-700 dark:text-red-400"
          }
        >
          {isOk ? "Done" : "Error"}
        </span>
      </div>
      <div className="space-y-2 rounded-md border bg-muted/30 p-2 font-mono text-xs">
        {!isOk && result.error && (
          <div className="text-amber-700 dark:text-amber-400">{result.error}</div>
        )}
        {isOk && result.url && (
          <div>
            <span className="text-muted-foreground">URL: </span>
            <span className="break-all">{result.url}</span>
          </div>
        )}
        {isOk && result.text !== undefined && result.text !== "" && (
          <div>
            <div className="mb-0.5 font-medium text-muted-foreground">
              Text
            </div>
            <TruncatedOutput text={result.text} maxLength={300} />
          </div>
        )}
        {isOk &&
          result.screenshot !== undefined &&
          result.screenshot !== "" && (
            <div>
              <div className="mb-0.5 font-medium text-muted-foreground">
                Screenshot
              </div>
              <img
                src={result.screenshot}
                alt="Page screenshot"
                className="max-w-full rounded border"
                style={{ maxHeight: 400 }}
              />
            </div>
          )}
      </div>
      {errorText && (
        <div className="rounded bg-destructive/10 px-2 py-1 text-sm text-destructive">
          {errorText}
        </div>
      )}
    </div>
  );
}
