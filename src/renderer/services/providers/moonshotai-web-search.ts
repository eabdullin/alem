import {
  createProviderToolFactory,
  lazySchema,
  zodSchema,
} from "@ai-sdk/provider-utils";
import { z } from "zod";

/**
 * Moonshot AI built-in web search tool.
 * Uses createProviderToolFactoryWithOutputSchema similar to OpenAI's web-search.
 * Per Moonshot docs: https://platform.moonshot.ai/docs/guide/use-web-search
 * - Declare with type "builtin_function" and name "$web_search"
 * - Execute by returning the model's arguments as-is (server performs the search)
 */

export const moonshotaiWebSearchToolFactory = createProviderToolFactory<
    {},
    {}
  >({
    id: "moonshotai.$web_search",
    inputSchema: lazySchema(() => zodSchema(z.any()))
  });

export const createMoonshotaiWebSearchTool = (
  args: Parameters<typeof moonshotaiWebSearchToolFactory>[0] = {}, // default
) => moonshotaiWebSearchToolFactory(args);
