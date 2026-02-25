"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TruncatedOutput } from "@/utils/truncated-output";
import type { ToolDisplayProps } from "../types";
import type { TerminalRunResult, TerminalOutcome } from "@/shared/tools/terminal/types";

const COMMAND_TRUNCATE_LENGTH = 300;

export function getConfirmationPreview(input: unknown): ReactNode {
  if (input != null && typeof input === "object" && "command" in input) {
    const cmd = (input as { command?: string[] }).command;
    if (Array.isArray(cmd) && cmd.length > 0) {
      const full = cmd.join(" ");
      const display =
        full.length > COMMAND_TRUNCATE_LENGTH
          ? `${full.slice(0, COMMAND_TRUNCATE_LENGTH)}…`
          : full;
      return (
        <span className="text-sm">
          Allow to run following command in the terminal{" "}
          <code className="rounded bg-muted px-1 font-mono text-xs">
            {display}
          </code>
          ?
        </span>
      );
    }
  }
  return null;
}

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
        {outcome.exit_code === 0 ? "Done" : "Exit " + outcome.exit_code}
      </span>
    );
  }
  if (outcome.type === "timeout") {
    return (
      <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-xs font-medium text-red-700 dark:text-red-400">
        Timeout
      </span>
    );
  }
  return (
    <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-xs font-medium text-red-700 dark:text-red-400">
      Denied
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
            <TruncatedOutput text={stdout} />
          </div>
        )}
        {stderr && (
          <div>
            <TruncatedOutput
              text={stderr}
              className="text-amber-700 dark:text-amber-400"
            />
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
