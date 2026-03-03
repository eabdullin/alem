import { describe, it, expect, vi, beforeEach } from "vitest";
import { useChatActionsStore } from "./useChatActionsStore";

describe("useChatActionsStore", () => {
  beforeEach(() => {
    useChatActionsStore.setState({
      setMessages: null,
      setInputValue: null,
      inputHighlighted: false,
    });
  });

  it("starts with null actions and no highlight", () => {
    const state = useChatActionsStore.getState();
    expect(state.setMessages).toBeNull();
    expect(state.setInputValue).toBeNull();
    expect(state.inputHighlighted).toBe(false);
  });

  it("registers and unregisters actions", () => {
    const setMessages = vi.fn();
    const setInputValue = vi.fn();

    useChatActionsStore.getState().register({ setMessages, setInputValue });
    expect(useChatActionsStore.getState().setMessages).toBe(setMessages);
    expect(useChatActionsStore.getState().setInputValue).toBe(setInputValue);

    useChatActionsStore.getState().unregister();
    expect(useChatActionsStore.getState().setMessages).toBeNull();
    expect(useChatActionsStore.getState().setInputValue).toBeNull();
  });

  it("flashInput sets inputHighlighted to true", () => {
    useChatActionsStore.getState().flashInput();
    expect(useChatActionsStore.getState().inputHighlighted).toBe(true);
  });

  it("clearInputHighlight resets to false", () => {
    useChatActionsStore.getState().flashInput();
    expect(useChatActionsStore.getState().inputHighlighted).toBe(true);

    useChatActionsStore.getState().clearInputHighlight();
    expect(useChatActionsStore.getState().inputHighlighted).toBe(false);
  });
});
