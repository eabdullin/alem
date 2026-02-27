import type { UIMessage } from "ai";

export function getTextFromParts(parts: UIMessage["parts"]): string {
  return parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export function getToolPartName(part: UIMessage["parts"][number]): string {
  if (part.type === "dynamic-tool") {
    return part.toolName;
  }
  return part.type.startsWith("tool-") ? part.type.slice(5) : "";
}

export type ChainStepStatus = "complete" | "active" | "pending";

export function getToolStepStatus(
  part: UIMessage["parts"][number]
): ChainStepStatus {
  if (!("state" in part)) {
    return "complete";
  }

  switch (part.state) {
    case "input-streaming":
    case "input-available":
    case "approval-requested":
      return "active";
    case "approval-responded":
      return "pending";
    default:
      return "complete";
  }
}

/**
 * Extract attachment ID from a URL that uses the given prefix (e.g. "qurt-attachment://").
 */
export function getAttachmentIdFromUrl(
  url: string,
  attachmentPrefix: string
): string | undefined {
  return url.startsWith(attachmentPrefix)
    ? url.slice(attachmentPrefix.length)
    : undefined;
}
