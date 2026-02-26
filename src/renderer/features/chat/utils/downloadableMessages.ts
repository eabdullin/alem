import type { UIMessage } from "ai";
import type { ConversationMessage } from "@/components/ai-elements/conversation";
import type { BrowserAction } from "@/shared/tools/browser/types";
import type { TerminalRunResult } from "@/shared/tools/terminal/types";
import type { FilePatchResult } from "@/shared/tools/file-patch/types";
import { getTextFromParts, getToolPartName } from "./messageParts";

/** Format tool output for markdown export. Omits verbose data (terminal stdout/stderr, browser screenshots). */
function formatToolOutputForMarkdown(
  toolName: string,
  input: unknown,
  output: unknown,
  errorText: string | undefined
): string {
  const err = errorText ? `\nError: ${errorText}` : "";

  if (toolName === "run_terminal") {
    const cmd =
      input && typeof input === "object" && "command" in input && Array.isArray((input as { command?: string[] }).command)
        ? (input as { command: string[] }).command.join(" ")
        : "(no command)";
    const result = output as TerminalRunResult | undefined;
    if (!result || typeof result !== "object") {
      return `**Terminal:** \`${cmd}\`${err || " (pending or no output)"}`;
    }
    const { outcome, duration_ms, truncated } = result;
    const outcomeStr =
      outcome.type === "exit"
        ? `exit ${outcome.exit_code}`
        : outcome.type === "timeout"
          ? "timeout"
          : "denied";
    const meta = [outcomeStr, `${duration_ms}ms`];
    if (truncated) meta.push("output truncated");
    return `**Terminal:** \`${cmd}\` — ${meta.join(", ")}${err}`;
  }

  if (toolName === "browser_control") {
    const actions =
      input && typeof input === "object" && "actions" in input && Array.isArray((input as { actions?: BrowserAction[] }).actions)
        ? (input as { actions: BrowserAction[] }).actions
        : [];
    const labels = actions.map((a) => formatBrowserAction(a));
    const result = output as { ok?: boolean; url?: string; error?: string } | undefined;
    let suffix = "";
    if (result && typeof result === "object") {
      if (result.ok === true) {
        suffix = result.url ? ` — Done, URL: ${result.url}` : " — Done";
      } else if (result.error) {
        suffix = ` — Error: ${result.error}`;
      }
    }
    return `**Browser:** ${labels.join(" → ")}${suffix}${err}`;
  }

  if (toolName === "apply_file_patch") {
    const result = output as FilePatchResult | undefined;
    if (!result || typeof result !== "object") {
      return `**File patch:** (pending or no output)${err}`;
    }
    const { status, files_changed, rejected_ops } = result;
    const parts: string[] = [`status: ${status}`];
    if (files_changed?.length) parts.push(`files: ${files_changed.join(", ")}`);
    if (rejected_ops?.length) {
      parts.push(`rejected: ${rejected_ops.map((r) => `${r.path}: ${r.reason}`).join("; ")}`);
    }
    return `**File patch:** ${parts.join("; ")}${err}`;
  }

  // Unknown tool: compact summary, no full output dump
  const inputPreview =
    input && typeof input === "object" && Object.keys(input).length > 0
      ? JSON.stringify(input).slice(0, 200) + (JSON.stringify(input).length > 200 ? "…" : "")
      : "";
  return `**${toolName}:** ${inputPreview || "(no input)"}${err}`;
}

function formatBrowserAction(a: BrowserAction): string {
  switch (a.action) {
    case "open":
      return "Open browser";
    case "navigate":
      return `Navigate to ${a.url}`;
    case "click":
      return `Click at (${a.x}, ${a.y})`;
    case "move_mouse":
      return `Move mouse to (${a.x}, ${a.y})`;
    case "type":
      return `Type "${a.text}"`;
    case "press":
      return `Press ${a.key}`;
    case "scroll":
      return `Scroll ${a.direction}`;
    case "get_content":
      return `Get content from ${a.selector}`;
    case "wait":
      return `Wait ${a.seconds}s`;
    case "close":
      return "Close browser";
    default:
      return "Browser action";
  }
}

export function toDownloadableMessages(
  messages: UIMessage[]
): ConversationMessage[] {
  return messages.map((message) => {
    const text = getTextFromParts(message.parts);
    const block = message.parts
      .flatMap((part) => {
        if (part.type === "reasoning") {
          if (!part.text.trim()) return [];
          const quoted = part.text
            .trim()
            .split("\n")
            .map((line) => (line ? `> ${line}` : ">"))
            .join("\n");
          return [`*Reasoning:*\n\n${quoted}`];
        }
        if (!(part.type === "dynamic-tool" || part.type.startsWith("tool-"))) {
          return [];
        }

        const toolName = getToolPartName(part);
        const input = "input" in part ? part.input : {};
        const output = "output" in part ? part.output : undefined;
        const errorText = "errorText" in part ? part.errorText : undefined;

        return [formatToolOutputForMarkdown(toolName, input, output, errorText)];
      })
      .filter(Boolean);
    return {
      content: block.length > 0 ? `${text}\n\n${block.join("\n\n")}` : text,
      role: message.role,
    };
  });
}
