import { describe, it, expect, vi, beforeEach } from "vitest";
import type { QurtUIMessage } from "@/types/ui-message";
import { useCheckpointStore } from "./useCheckpointStore";
import { useActiveChatStore } from "./useActiveChatStore";
import { useChatActionsStore } from "./useChatActionsStore";

// Mock the chat-service to avoid IndexedDB dependency
vi.mock("@/services/chat-service", () => ({
  chatService: {
    saveMessages: vi.fn().mockResolvedValue(null),
  },
}));

// ── Helpers ──────────────────────────────────────────────────────────

function makeUserMessage(text: string, id = "u1", createdAt?: string): QurtUIMessage {
  return {
    id,
    role: "user",
    parts: [{ type: "text", text }],
    metadata: createdAt ? { createdAt } : undefined,
  };
}

function makeAssistantTextMessage(text: string, id = "a1"): QurtUIMessage {
  return {
    id,
    role: "assistant",
    parts: [{ type: "text", text }],
  };
}

// ── Tests ────────────────────────────────────────────────────────────

describe("useCheckpointStore", () => {
  const mockSetMessages = vi.fn();
  const mockSetInputValue = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();

    // Reset stores to initial state
    useCheckpointStore.setState({ isRestoring: false });

    // Set up active chat
    useActiveChatStore.setState({
      activeChat: {
        id: "chat-1",
        title: "Test Chat",
        messages: [],
        chatGroupIds: ["default"],
        terminalWorkspacePath: "/test/workspace",
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      isLoadingChat: false,
    });

    // Register mock actions
    useChatActionsStore.getState().register({
      setMessages: mockSetMessages,
      setInputValue: mockSetInputValue,
    });

    (globalThis as any).window = {
      qurt: {
        listCheckpoints: vi.fn().mockResolvedValue([]),
        restoreCheckpoints: vi.fn().mockResolvedValue({ restored: true }),
      },
    };
  });

  it("starts with isRestoring = false", () => {
    expect(useCheckpointStore.getState().isRestoring).toBe(false);
  });

  // ── restoreToMessage ────────────────────────────────────────────

  describe("restoreToMessage", () => {
    it("prevents concurrent restores", async () => {
      useCheckpointStore.setState({ isRestoring: true });

      const result = await useCheckpointStore.getState().restoreToMessage(
        0,
        [makeUserMessage("Hello")],
      );

      expect(result.ok).toBe(false);
      expect(result.error).toBe("Restore already in progress.");
    });

    it("returns error for invalid message index", async () => {
      const result = await useCheckpointStore.getState().restoreToMessage(
        0,
        [makeAssistantTextMessage("Not a user msg")],
      );

      expect(result.ok).toBe(false);
      expect(result.error).toBe("Invalid message index.");
    });

    it("returns error when no active chat", async () => {
      useActiveChatStore.setState({ activeChat: null });

      const result = await useCheckpointStore.getState().restoreToMessage(
        0,
        [makeUserMessage("Hello")],
      );

      expect(result.ok).toBe(false);
      expect(result.error).toBe("No active chat.");
    });

    it("returns error when chat actions not registered", async () => {
      useChatActionsStore.getState().unregister();

      const result = await useCheckpointStore.getState().restoreToMessage(
        0,
        [makeUserMessage("Hello")],
      );

      expect(result.ok).toBe(false);
      expect(result.error).toBe("Chat not ready.");
    });

    it("sets isRestoring during restore and resets after", async () => {
      const messages = [
        makeUserMessage("Hello", "u1"),
        makeAssistantTextMessage("World", "a1"),
      ];

      const promise = useCheckpointStore.getState().restoreToMessage(0, messages);

      expect(useCheckpointStore.getState().isRestoring).toBe(true);
      await promise;
      expect(useCheckpointStore.getState().isRestoring).toBe(false);
    });

    it("trims messages and sets input value without checkpoints", async () => {
      const messages = [
        makeUserMessage("First", "u1"),
        makeAssistantTextMessage("Response 1", "a1"),
        makeUserMessage("Second", "u2"),
        makeAssistantTextMessage("Response 2", "a2"),
      ];

      const result = await useCheckpointStore.getState().restoreToMessage(2, messages);

      expect(result.ok).toBe(true);
      // No checkpoints → no file restore call
      expect(window.qurt!.restoreCheckpoints).not.toHaveBeenCalled();
      expect(mockSetMessages).toHaveBeenCalledWith([messages[0], messages[1]]);
      expect(mockSetInputValue).toHaveBeenCalledWith("Second");
    });

    it("restores using the message's createdAt as the checkpoint timestamp", async () => {
      (window.qurt!.listCheckpoints as any).mockResolvedValue([
        "2025-01-01T00:00:00Z",
        "2025-01-01T00:01:00Z",
        "2025-01-01T00:02:00Z",
      ]);

      const messages = [
        makeUserMessage("Task", "u1", "2025-01-01T00:01:30Z"),
        makeAssistantTextMessage("Done", "a1"),
      ];

      const result = await useCheckpointStore.getState().restoreToMessage(0, messages);

      expect(result.ok).toBe(true);
      expect(window.qurt!.restoreCheckpoints).toHaveBeenCalledWith({
        workspaceRoot: "/test/workspace",
        timestamp: "2025-01-01T00:01:30Z",
      });
      expect(mockSetMessages).toHaveBeenCalledWith([]);
      expect(mockSetInputValue).toHaveBeenCalledWith("Task");
    });

    it("skips file restore when message has no createdAt", async () => {
      (window.qurt!.listCheckpoints as any).mockResolvedValue([
        "2025-01-01T00:00:00Z",
      ]);

      // No createdAt → no checkpoint selected → file restore skipped.
      const messages = [
        makeUserMessage("Task", "u1"),
        makeAssistantTextMessage("Done", "a1"),
      ];

      const result = await useCheckpointStore.getState().restoreToMessage(0, messages);

      expect(result.ok).toBe(true);
      expect(window.qurt!.restoreCheckpoints).not.toHaveBeenCalled();
    });

    it("skips file restore when no checkpoints exist", async () => {
      (window.qurt!.listCheckpoints as any).mockResolvedValue([]);

      const messages = [
        makeUserMessage("Task", "u1"),
        makeAssistantTextMessage("Done", "a1"),
      ];

      const result = await useCheckpointStore.getState().restoreToMessage(0, messages);

      expect(result.ok).toBe(true);
      expect(window.qurt!.restoreCheckpoints).not.toHaveBeenCalled();
      expect(mockSetMessages).toHaveBeenCalledWith([]);
    });

    it("returns error when restoreCheckpoints fails", async () => {
      (window.qurt!.listCheckpoints as any).mockResolvedValue([
        "2025-01-01T00:00:00Z",
      ]);
      (window.qurt!.restoreCheckpoints as any).mockResolvedValue({
        restored: false,
        error: "No mirror found",
      });

      // Must have createdAt so the store attempts file restore
      const messages = [
        makeUserMessage("Task", "u1", "2025-01-01T00:00:30Z"),
        makeAssistantTextMessage("Done", "a1"),
      ];

      const result = await useCheckpointStore.getState().restoreToMessage(0, messages);

      expect(result.ok).toBe(false);
      expect(result.error).toBe("No mirror found");
      expect(mockSetMessages).not.toHaveBeenCalled();
    });

    it("resets isRestoring even on failure", async () => {
      (window.qurt!.listCheckpoints as any).mockResolvedValue([
        "2025-01-01T00:00:00Z",
      ]);
      (window.qurt!.restoreCheckpoints as any).mockResolvedValue({
        restored: false,
        error: "fail",
      });

      const messages = [
        makeUserMessage("Task", "u1", "2025-01-01T00:00:30Z"),
        makeAssistantTextMessage("Done", "a1"),
      ];

      await useCheckpointStore.getState().restoreToMessage(0, messages);
      expect(useCheckpointStore.getState().isRestoring).toBe(false);
    });

    it("skips file restore when workspace not set", async () => {
      useActiveChatStore.setState({
        activeChat: {
          id: "chat-1",
          title: "Test",
          messages: [],
          chatGroupIds: ["default"],
          terminalWorkspacePath: "",
          isArchived: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

      const messages = [
        makeUserMessage("Hello", "u1"),
        makeAssistantTextMessage("World", "a1"),
      ];

      const result = await useCheckpointStore.getState().restoreToMessage(0, messages);

      expect(result.ok).toBe(true);
      expect(window.qurt!.restoreCheckpoints).not.toHaveBeenCalled();
      expect(mockSetMessages).toHaveBeenCalledWith([]);
      expect(mockSetInputValue).toHaveBeenCalledWith("Hello");
    });
  });
});
