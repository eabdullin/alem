"use client";

import { Link2 } from "lucide-react";
import {
  ChainOfThoughtSearchResult,
  ChainOfThoughtSearchResults,
} from "@/components/ai-elements/chain-of-thought";
import { ToolOutput } from "@/components/ai-elements/tool";
import { parseWebSearchOutput } from "@/lib/parse-web-search-output";
import { urlToDomain } from "@/lib/url-to-domain";
import type { ToolDisplayProps } from "../types";

function domainForDisplay(url: string): string {
  const domain = urlToDomain(url);
  return domain.replace(/^www\./i, "");
}

/**
 * Web search tool display: domain-only result badges (step icon + label live on ChainOfThoughtStep).
 */
export function WebSearchToolDisplay({
  output,
  errorText,
}: ToolDisplayProps) {
  const parsed =
    output != null ? parseWebSearchOutput("web_search", output) : [];

  return (
    <div className="space-y-2">
      {parsed.length > 0 && (
        <ChainOfThoughtSearchResults className="flex flex-wrap gap-2">
          {parsed.map((item, i) => {
            const domain = item.url ? domainForDisplay(item.url) : null;
            const label = domain || item.title || "Source";
            return (
              <ChainOfThoughtSearchResult
                key={`${i}-${item.url}-${item.title ?? ""}`}
              >
                {item.url ? (
                  <a
                    href={item.url}
                    rel="noopener noreferrer"
                    target="_blank"
                    className="inline-flex items-center gap-1 cursor-pointer hover:underline"
                  >
                    <Link2 className="size-3 shrink-0 text-muted-foreground" />
                    {label}
                  </a>
                ) : (
                  <span>{label}</span>
                )}
              </ChainOfThoughtSearchResult>
            );
          })}
        </ChainOfThoughtSearchResults>
      )}
      {(parsed.length === 0 || errorText) && (
        <ToolOutput output={output} errorText={errorText} />
      )}
    </div>
  );
}
