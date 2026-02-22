"use client";

import { ToolOutput } from "@/components/ai-elements/tool";
import { cn } from "@/lib/utils";
import type { ToolDisplayProps } from "../types";
import type { TerminalRunResult, TerminalOutcome } from "./types";

function OutcomeBadge({ outcome }: { outcome: TerminalOutcome }) {
  if (outcome.type === "exit") {
    return (
      <span
        className={cn(
          "rounded px-1.5 py-0.5 text-xs font-medium",
          outcome.exit_code === 0
            ? "bg-green-500/20 text-green-700 dark:text-green-400"
            : "bg-amber-500/20 text-amber-700 dark:text-amber-400"
        )}
      >
        exit {outcome.exit_code}
      </span>
    );
  }
  if (outcome.type === "timeout") {
    return (
      <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-xs font-medium text-red-700 dark:text-red-400">
        timeout
      </span>
    );
  }
  return (
    <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-xs font-medium text-red-700 dark:text-red-400">
      denied
    </span>
  );
}

export function TerminalToolDisplay({
  input,
  output,
  errorText,
}: ToolDisplayProps) {
  const result = output as TerminalRunResult | undefined;
  const cmd =
    input && typeof input === "object" && "command" in input && Array.isArray((input as { command?: string[] }).command)
      ? (input as { command: string[] }).command
      : [];

  const hasResult = result && typeof result === "object";
  if (!hasResult) {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
            {cmd.length ? cmd.join(" ") : "(no command)"}
          </code>
        </div>
        <div className="space-y-2 rounded-md border bg-muted/30 p-2 font-mono text-xs">
          {errorText ? (
            <div className="text-amber-700 dark:text-amber-400">{errorText}</div>
          ) : (
            <div className="text-muted-foreground">Pending approval or no output yet.</div>
          )}
        </div>
      </div>
    );
  }

  const { stdout, stderr, outcome, duration_ms, truncated } = result;

  const hasOutput = !!(stdout || stderr);
  const failurePreview =
    !hasOutput &&
    (outcome.type === "denied"
      ? outcome.reason
      : outcome.type === "timeout"
        ? "Command timed out."
        : outcome.type === "exit" && outcome.exit_code !== 0
          ? `Process exited with code ${outcome.exit_code}.`
          : null);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
          {cmd.length ? cmd.join(" ") : "(no command)"}
        </code>
        <OutcomeBadge outcome={outcome} />
        <span className="text-muted-foreground">{duration_ms}ms</span>
        {truncated && (
          <span className="text-amber-600 dark:text-amber-500">output truncated</span>
        )}
      </div>
      <div className="space-y-2 rounded-md border bg-muted/30 p-2 font-mono text-xs">
        {stdout && (
          <div>
            <div className="mb-0.5 font-medium text-muted-foreground">stdout</div>
            <pre className="whitespace-pre-wrap break-words">{stdout}</pre>
          </div>
        )}
        {stderr && (
          <div>
            <div className="mb-0.5 font-medium text-muted-foreground">stderr</div>
            <pre className="whitespace-pre-wrap break-words text-amber-700 dark:text-amber-400">
              {stderr}
            </pre>
          </div>
        )}
        {failurePreview && (
          <div>
            <div className="mb-0.5 font-medium text-muted-foreground">output</div>
            <pre className="whitespace-pre-wrap break-words text-amber-700 dark:text-amber-400">
              {failurePreview}
            </pre>
          </div>
        )}
        {!hasOutput && !failurePreview && (
          <div className="text-muted-foreground">No output</div>
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
