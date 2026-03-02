import { Link } from "react-router-dom";
import { SearchIcon, AlertTriangle } from "lucide-react";
import type { ToolDefinition, ToolSetOptions } from "../types";
import { WebSearchToolDisplay } from "./display";
import { getWebSearchToolSet } from "./action";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

function getSearchQuery(input: unknown): string {
  if (input == null || typeof input !== "object") return "";
  const o = input as Record<string, unknown>;
  if (typeof o.query === "string" && o.query.trim()) return o.query.trim();
  return "";
}

function DuckDuckGoBrowserSearchHint({
  onDontShowAgain,
}: {
  onDontShowAgain: () => void;
}) {
  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className="inline-flex size-4 shrink-0 items-center justify-center rounded text-amber-500 hover:text-amber-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-1"
          aria-label="Search provider info"
        >
          <AlertTriangle className="size-3.5" />
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        align="start"
        side="bottom"
        className="w-64 space-y-2 p-3"
      >
        <p className="text-xs text-muted-foreground">
          Search via DuckDuckGo Browser. For advanced search (Brave, Exa), go to
          Settings.
        </p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link
            to="/settings?section=search-providers"
            className="text-xs text-primary-1 hover:underline"
          >
            Search Providers
          </Link>
          <span className="text-xs text-muted-foreground">·</span>
          <button
            type="button"
            className="text-xs text-primary-1 hover:underline"
            onClick={onDontShowAgain}
          >
            Don&apos;t show again
          </button>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

export const webSearchTool: ToolDefinition = {
  id: "web-search",
  description:
    "Search the web for live or recent information. Use when the user asks about current events, facts, or content that may change.",
  displayToolIds: ["web_search", "google_search"],
  stepIcon: SearchIcon,
  getToolSet: (options?: ToolSetOptions) => getWebSearchToolSet(options),
  getStepLabel: (input, context) => {
    const query = getSearchQuery(input);
    const base = query ? `Searching for ${query}` : "Searching the web";
    if (
      context?.searchProviderId === "duckduckgo-browser" &&
      !context?.hideDuckDuckGoBrowserSearchHint
    ) {
      const handleDontShowAgain = () => {
        context.updateSettings?.({
          ...context.settings,
          hideDuckDuckGoBrowserSearchHint: true,
        });
      };
      return (
        <span className="flex flex-wrap items-center gap-1.5">
          <span>{base}</span>
          <DuckDuckGoBrowserSearchHint onDontShowAgain={handleDontShowAgain} />
        </span>
      );
    }
    return base;
  },
  Display: WebSearchToolDisplay,
};
