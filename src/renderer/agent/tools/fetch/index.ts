import { LinkIcon } from "lucide-react";
import type { ToolDefinition } from "../types";
import { getFetchToolSet } from "./action";
import { FetchToolDisplay } from "./display";

function getStepLabel(input: unknown): string {
  if (input != null && typeof input === "object" && "url" in input) {
    const url = (input as { url: string }).url;
    if (typeof url === "string" && url.trim()) return `Fetching ${url}`;
  }
  return "Fetching URL";
}

export const fetchTool: ToolDefinition = {
  id: "fetch",
  description:
    "Fetch the content of a web page by URL. Returns text as Markdown. Use for reading articles, docs, or specific pages.",
  displayToolIds: ["web_fetch"],
  getToolSet: getFetchToolSet,
  stepIcon: LinkIcon,
  getStepLabel: (input) => getStepLabel(input),
  Display: FetchToolDisplay,
};
