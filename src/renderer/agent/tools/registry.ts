import type { ToolSet } from "ai";
import type { ToolSetOptions } from "./types";
import { browserTool } from "./browser";
import { fetchTool } from "./fetch";
import { filePatchTool } from "./file-patch";
import { memoryTool } from "./memory";
import { readFileTool } from "./read-file";
import { terminalTool } from "./terminal";
import { webSearchTool } from "./web-search";

const definitions = [
  webSearchTool,
  fetchTool,
  readFileTool,
  terminalTool,
  filePatchTool,
  browserTool,
  memoryTool,
];

const byDisplayId = new Map<string | undefined, (typeof definitions)[number]>();
for (const def of definitions) {
  for (const id of def.displayToolIds) {
    byDisplayId.set(id, def);
  }
}

const GENERAL_TOOL_DEFINITION_IDS = new Set([
  "web-search",
  "fetch",
  "read-file",
  "terminal",
  "file-patch",
  "browser",
  "memory",
]);

/**
 * All registered tool definitions (type, action, display).
 */
export function getToolDefinitions() {
  return definitions;
}

function mergeToolSets(
  defs: (typeof definitions)[number][],
  options?: ToolSetOptions,
): ToolSet {
  const merged: Record<string, unknown> = {};
  for (const def of defs) {
    if (!def.getToolSet) continue;
    const set = def.getToolSet(options);
    Object.assign(merged, set);
  }
  return merged as ToolSet;
}

/**
 * ToolSet for provider-agnostic local tools (terminal/file-patch/browser/memory).
 */
export function getGeneralToolSet(
  options?: ToolSetOptions,
): ToolSet {
  const defs = definitions.filter((d) => GENERAL_TOOL_DEFINITION_IDS.has(d.id));
  return mergeToolSets(defs, options);
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
