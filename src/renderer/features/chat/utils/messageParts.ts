import { QURT_ATTACHMENT_PREFIX } from "@/services/qurt-chat-transport";
import {
  getTextFromParts as getTextFromPartsBase,
  getToolPartName,
  getToolStepStatus,
  getAttachmentIdFromUrl as getAttachmentIdFromUrlBase,
  type ChainStepStatus,
} from "@/lib/chat/messageParts";
import { getToolDefinition } from "@/tools";
import type { UIMessage } from "ai";

export {
  getTextFromPartsBase as getTextFromParts,
  getToolPartName,
  getToolStepStatus,
};
export type { ChainStepStatus };

export function getAttachmentIdFromUrl(url: string): string | undefined {
  return getAttachmentIdFromUrlBase(url, QURT_ATTACHMENT_PREFIX);
}

/**
 * Filter out tool parts with unknown tool names (e.g. google:memory).
 * Used before persisting so invalid model tool calls are not saved.
 */
export function filterMessagesByKnownTools(messages: UIMessage[]): UIMessage[] {
  return messages.map((msg) => {
    const filtered = msg.parts.filter((part) => {
      if (part.type !== "dynamic-tool" && !part.type.startsWith("tool-")) {
        return true;
      }
      const toolName = getToolPartName(part);
      return getToolDefinition(toolName) != null;
    });
    return { ...msg, parts: filtered };
  });
}
