import {
  Confirmation,
  ConfirmationAction,
  ConfirmationActions,
  ConfirmationRequest,
} from "@/components/ai-elements/confirmation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { extractBrowserHosts } from "@/services/tool-approval-service";
import type { ToolApprovalResponseParams } from "@/hooks/useToolApproval";
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

type ToolApprovalRequestProps = {
  approvalId: string;
  toolName: string;
  input: unknown;
  preview: ReactNode;
  onApprovalResponse: (params: ToolApprovalResponseParams) => void;
};

export function ToolApprovalRequest({
  approvalId,
  toolName,
  input,
  preview,
  onApprovalResponse,
}: ToolApprovalRequestProps) {
  const respond = (scope: ToolApprovalResponseParams["scope"]) =>
    onApprovalResponse({ approvalId, scope, toolName, input });

  return (
    <Confirmation
      key={approvalId}
      approval={{ id: approvalId }}
      state="approval-requested"
      className="mb-3"
    >
      <ConfirmationRequest>{preview}</ConfirmationRequest>
      <ConfirmationActions>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-8 px-3 text-sm">
              Allow options
              <ChevronDown className="ml-1 size-3.5 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => respond("once")}>
              Allow once
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => respond("tool-chat")}>
              Allow this tool for this chat
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => respond("all-chat")}>
              Allow all tools for this chat
            </DropdownMenuItem>
            {toolName === "browser_control" &&
              extractBrowserHosts(input).length > 0 && (
                <DropdownMenuItem onClick={() => respond("website-global")}>
                  Allow this website globally
                </DropdownMenuItem>
              )}
          </DropdownMenuContent>
        </DropdownMenu>
        <ConfirmationAction
          variant="outline"
          onClick={() => respond("reject")}
        >
          Reject
        </ConfirmationAction>
        <ConfirmationAction
          variant="default"
          onClick={() => respond("once")}
        >
          Approve
        </ConfirmationAction>
      </ConfirmationActions>
    </Confirmation>
  );
}
