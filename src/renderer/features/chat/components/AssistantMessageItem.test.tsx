import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AssistantMessageItem } from "./AssistantMessageItem";

vi.mock("@/tools", () => ({
  getToolDefinition: vi.fn(() => ({ stepIcon: undefined, getStepLabel: undefined })),
  getToolDisplay: vi.fn(() => undefined),
}));

describe("AssistantMessageItem", () => {
  it("renders text-only message", () => {
    const message = {
      id: "msg-1",
      role: "assistant" as const,
      parts: [{ type: "text" as const, text: "Hello, how can I help?" }],
    };
    render(
      <AssistantMessageItem
        message={message}
        addToolApprovalResponse={() => {}}
      />,
    );
    expect(screen.getByText("Hello, how can I help?")).toBeInTheDocument();
  });

  it("renders message with reasoning part", () => {
    const message = {
      id: "msg-2",
      role: "assistant" as const,
      parts: [
        { type: "reasoning" as const, text: "Let me think...", state: "done" as const },
        { type: "text" as const, text: "The answer is 42." },
      ],
    };
    render(
      <AssistantMessageItem
        message={message}
        addToolApprovalResponse={() => {}}
      />,
    );
    expect(screen.getByText("The answer is 42.")).toBeInTheDocument();
    expect(screen.getByText("Let me think...")).toBeInTheDocument();
  });

  it("renders tool part with output using generic ToolOutput when no custom display", () => {
    const message = {
      id: "msg-3",
      role: "assistant" as const,
      parts: [
        {
          type: "dynamic-tool" as const,
          toolName: "unknown_tool",
          toolCallId: "tc-1",
          input: {},
          output: "Tool result",
          state: "output-available" as const,
        },
      ],
    };
    render(
      <AssistantMessageItem
        message={message}
        addToolApprovalResponse={() => {}}
      />,
    );
    expect(screen.getByText("Tool result")).toBeInTheDocument();
  });

  it("renders Reject and Allow buttons when tool needs approval", () => {
    const message = {
      id: "msg-4",
      role: "assistant" as const,
      parts: [
        {
          type: "dynamic-tool" as const,
          toolName: "run_terminal",
          toolCallId: "tc-2",
          state: "approval-requested" as const,
          approval: { id: "approval-1" },
          input: { command: ["rm", "-rf", "/"] },
        },
      ],
    };
    const onResponse = vi.fn();
    render(
      <AssistantMessageItem
        message={message}
        addToolApprovalResponse={onResponse}
      />,
    );
    const allowBtn = screen.getByRole("button", { name: /allow/i });
    const rejectBtn = screen.getByRole("button", { name: /reject/i });
    expect(allowBtn).toBeInTheDocument();
    expect(rejectBtn).toBeInTheDocument();

    fireEvent.click(rejectBtn);
    expect(onResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        approvalId: "approval-1",
        scope: "reject",
        toolName: "run_terminal",
      }),
    );
  });
});
