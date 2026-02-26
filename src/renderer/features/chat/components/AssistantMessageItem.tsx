import {
  ChainOfThought,
  ChainOfThoughtContent,
} from "@/components/ai-elements/chain-of-thought";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { getToolDefinition, getToolDisplay } from "@/tools";
import { Icon } from "@/utils/icons";
import { getTextFromParts, getToolPartName } from "../utils/messageParts";
import { ToolStepItem } from "./ToolStepItem";
import type { ToolApprovalResponseParams } from "../hooks/useChatPageController";
import type { UIMessage } from "ai";

type AssistantMessageItemProps = {
  message: UIMessage;
  addToolApprovalResponse: (params: ToolApprovalResponseParams) => void;
  isStopped?: boolean;
};

function getStepKey(
  part: UIMessage["parts"][number],
  messageId: string,
  index: number
): string {
  if (part.type === "reasoning") return `reasoning-${messageId}-${index}`;
  if (part.type === "dynamic-tool" || part.type.startsWith("tool-")) {
    return "toolCallId" in part ? part.toolCallId : `${getToolPartName(part)}-${index}`;
  }
  return `part-${messageId}-${index}`;
}

export function AssistantMessageItem({
  message,
  addToolApprovalResponse,
  isStopped,
}: AssistantMessageItemProps) {
  const text = getTextFromParts(message.parts);
  const chainSteps = message.parts.map((part, index) => {
    const isToolPart =
      part.type === "dynamic-tool" || part.type.startsWith("tool-");
    const toolName = isToolPart ? getToolPartName(part) : "";
    const toolDef = isToolPart ? getToolDefinition(toolName) : undefined;
    const ToolDisplay = isToolPart ? getToolDisplay(toolName) : undefined;
    return (
      <ToolStepItem
        key={getStepKey(part, message.id, index)}
        part={part}
        messageId={message.id}
        partIndex={index}
        addToolApprovalResponse={addToolApprovalResponse}
        toolDef={toolDef}
        ToolDisplay={ToolDisplay}
      />
    );
  });
  const hasChain = message.parts.some(
    (part) =>
      (part.type === "reasoning" && part.text.trim()) ||
      ((part.type === "dynamic-tool" || part.type.startsWith("tool-")) &&
        getToolDefinition(getToolPartName(part)) != null),
  );

  return (
    <Message from="assistant" key={message.id}>
      <MessageContent className="max-w-[50rem] rounded-[1.25rem] bg-n-2 px-5 py-4 dark:bg-n-7">
        {hasChain && (
          <ChainOfThought className="mb-2" defaultOpen={true}>
            <ChainOfThoughtContent>{chainSteps}</ChainOfThoughtContent>
          </ChainOfThought>
        )}
        <MessageResponse>{text}</MessageResponse>
        {isStopped && (
          <div className="mt-2 flex items-center gap-1.5 caption1 text-n-4 dark:text-n-3/80">
            <Icon name="stop" className="size-3.5" />
            Stopped
          </div>
        )}
      </MessageContent>
    </Message>
  );
}
