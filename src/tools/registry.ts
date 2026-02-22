import type { ToolSet } from "ai";
import type { AiProvider, ToolSetOptions } from "./types";
import { terminalTool } from "./terminal";
import { webSearchTool } from "./web-search";

const definitions = [webSearchTool, terminalTool];

const byDisplayId = new Map<string | undefined, (typeof definitions)[number]>();
for (const def of definitions) {
  for (const id of def.displayToolIds) {
    byDisplayId.set(id, def);
  }
}

/**
 * All registered tool definitions (type, action, display).
 */
export function getToolDefinitions() {
  return definitions;
}

/**
 * Get the ToolSet for agent mode: merge all tools' getToolSet(provider, apiKey, options).
 */
export function getToolSetForProvider(
  provider: AiProvider,
  apiKey: string,
  options?: ToolSetOptions
): ToolSet {
  const merged: Record<string, unknown> = {};
  for (const def of definitions) {
    const set = def.getToolSet(provider, apiKey, options);
    Object.assign(merged, set);
  }
  return merged as ToolSet;
}

/**
 * Get the tool definition for a step by the SDK tool name (e.g. web_search, google_search).
 * Returns undefined if no tool is registered for that name.
 */
export function getToolDefinition(toolName: string) {
  return byDisplayId.get(toolName);
}

/**
 * Get the Display component for a tool step by the SDK tool name (e.g. web_search, google_search).
 * Returns undefined if no custom display is registered (fall back to generic ToolOutput).
 */
export function getToolDisplay(toolName: string) {
  return byDisplayId.get(toolName)?.Display;
}
