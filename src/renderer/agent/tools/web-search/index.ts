import { SearchIcon } from "lucide-react";
import type { ToolDefinition } from "../types";
import { getWebSearchToolSet } from "./action";
import { WebSearchToolDisplay } from "./display";

function getSearchQuery(input: unknown): string {
  if (input == null || typeof input !== "object") return "";
  const o = input as Record<string, unknown>;
  if (typeof o.query === "string" && o.query.trim()) return o.query.trim();
  return "";
}

export const webSearchTool: ToolDefinition = {
  id: "web-search",
  description:
    "Search the web for live or recent information. Use when the user asks about current events, facts, or content that may change.",
  displayToolIds: ["web_search", "google_search"],
  getToolSet: getWebSearchToolSet,
  stepIcon: SearchIcon,
  getStepLabel: (input) => {
    const query = getSearchQuery(input);
    return query ? `Searching for ${query}` : "Searching the web";
  },
  Display: WebSearchToolDisplay,
};
