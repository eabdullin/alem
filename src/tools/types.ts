import type { LucideIcon } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import type { ToolSet } from "ai";

export type AiProvider = "openai" | "anthropic" | "google";

/** Options passed when building the tool set (e.g. per-chat overrides). */
export interface ToolSetOptions {
  /** Per-chat workspace root for terminal; when set, overrides global default. */
  terminalWorkspaceOverride?: string;
}

/**
 * Props passed to a tool's Display component in the Chain of Thought UI.
 */
export interface ToolDisplayProps {
  toolName: string;
  input: unknown;
  output: unknown;
  errorText?: string;
}

/**
 * Definition of a tool: type (description), action (SDK tool), and display (UI).
 * Each tool lives in its own folder under src/tools/<tool-name>/.
 */
export interface ToolDefinition {
  /** Unique key for this tool definition (e.g. "web-search"). */
  id: string;
  /** Human-readable description of what the tool does (for docs/system). */
  description: string;
  /** SDK tool names this definition handles (e.g. ["web_search", "google_search"]). */
  displayToolIds: string[];
  /** Returns the ToolSet to pass to the model for the given provider (proxy per provider). */
  getToolSet: (
    provider: AiProvider,
    apiKey: string,
    options?: ToolSetOptions
  ) => ToolSet;
  /** Optional icon for the ChainOfThoughtStep (e.g. SearchIcon for web search). */
  stepIcon?: LucideIcon;
  /** Optional label for the ChainOfThoughtStep derived from tool input (e.g. "Searching for ..."). */
  getStepLabel?: (input: unknown) => ReactNode;
  /** React component that renders this tool's step body (results only; step icon/label are on the step). */
  Display: ComponentType<ToolDisplayProps>;
}
