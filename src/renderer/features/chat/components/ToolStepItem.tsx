import { ChainOfThoughtStep } from "@/components/ai-elements/chain-of-thought";
import { streamdownPlugins } from "@/components/ai-elements/message";
import { Streamdown } from "streamdown";
import { TruncatedOutput } from "@/utils/truncated-output";
import { ToolOutput } from "@/components/ai-elements/tool";
import { getToolDefinition, getToolDisplay } from "@/tools";
import { getToolPartName, getToolStepStatus } from "../utils/messageParts";
import { ToolApprovalRequest } from "./ToolApprovalRequest";
import type { ToolApprovalResponseParams } from "../hooks/useChatPageController";
import type { UIMessage } from "ai";
import { BrainIcon } from "lucide-react";

type ToolStepItemProps = {
  part: UIMessage["parts"][number];
  messageId: string;
  partIndex: number;
  addToolApprovalResponse: (params: ToolApprovalResponseParams) => void;
};

export function ToolStepItem({
  part,
  messageId,
  partIndex,
  addToolApprovalResponse,
}: ToolStepItemProps) {
  if (part.type === "reasoning") {
    if (!part.text.trim()) {
      return null;
    }
    return (
      <ChainOfThoughtStep
        icon={BrainIcon}
        label="Reasoning"
        status={part.state === "streaming" ? "active" : "complete"}
      >
        <TruncatedOutput
          text={part.text}
          className="text-muted-foreground text-sm"
          render={(content) => (
            <Streamdown plugins={streamdownPlugins}>{content}</Streamdown>
          )}
        />
      </ChainOfThoughtStep>
    );
  }

  if (!(part.type === "dynamic-tool" || part.type.startsWith("tool-"))) {
    return null;
  }

  const toolName = getToolPartName(part);
  const def = getToolDefinition(toolName);
  const input = "input" in part ? part.input : {};
  const output = "output" in part ? part.output : undefined;
  const errorText = "errorText" in part ? part.errorText : undefined;
  const needsApproval =
    "state" in part &&
    part.state === "approval-requested" &&
    part.approval;

  return (
    <ChainOfThoughtStep
      icon={def?.stepIcon}
      label={def?.getStepLabel?.(input) ?? toolName.replace(/_/g, " ")}
      status={getToolStepStatus(part)}
    >
      {needsApproval && part.approval ? (
        <ToolApprovalRequest
          approvalId={part.approval.id}
          toolName={toolName}
          input={input}
          preview={
            def?.getConfirmationPreview?.(input) ?? (
              <span className="text-sm">Allow this action?</span>
            )
          }
          onApprovalResponse={addToolApprovalResponse}
        />
      ) : output !== undefined || errorText ? (
        (() => {
          const ToolDisplay = getToolDisplay(toolName);
          if (ToolDisplay) {
            return (
              <ToolDisplay
                toolName={toolName}
                input={input}
                output={output}
                errorText={errorText}
              />
            );
          }
          return <ToolOutput output={output} errorText={errorText} />;
        })()
      ) : (
        <div className="text-xs text-muted-foreground">
          {"state" in part && part.state === "approval-responded"
            ? "Approval recorded. Continuing..."
            : "Executing..."}
        </div>
      )}
    </ChainOfThoughtStep>
  );
}
