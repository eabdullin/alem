import type { UIMessage } from "ai";
import type { ConversationMessage } from "@/components/ai-elements/conversation";
import { getTextFromParts, getToolPartName } from "./messageParts";

export function toDownloadableMessages(
  messages: UIMessage[]
): ConversationMessage[] {
  return messages.map((message) => {
    const text = getTextFromParts(message.parts);
    const block = message.parts
      .flatMap((part) => {
        if (part.type === "reasoning") {
          return part.text.trim() ? [`Reasoning:\n${part.text}`] : [];
        }
        if (!(part.type === "dynamic-tool" || part.type.startsWith("tool-"))) {
          return [];
        }

        const toolName = getToolPartName(part);
        const input = "input" in part ? part.input : {};
        const output = "output" in part ? part.output : undefined;
        const errorText = "errorText" in part ? part.errorText : undefined;

        return [
          `Tool ${toolName}:\n${JSON.stringify(input, null, 2)}${
            output != null ? `\nResult: ${JSON.stringify(output)}` : ""
          }${errorText ? `\nError: ${errorText}` : ""}`,
        ];
      })
      .filter(Boolean);
    return {
      content: block.length > 0 ? `${text}\n\n${block.join("\n\n")}` : text,
      role: message.role,
    };
  });
}
