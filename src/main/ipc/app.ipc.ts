import { ipcMain } from "electron";
import { getStore } from "../services/appStore";
import { ElectronFileStore, type SaveAttachmentInput } from "../services/fileStore";
import {
  readCoreMemory,
  appendConversation,
  runMemoryCommand,
  type ConversationEntry,
  type MemoryCommandInput,
} from "../services/memoryStore";
import { IPC_CHANNELS } from "../../shared/ipc/channels";

export function registerAppIpc(): void {
  const store = getStore();
  const fileStore = new ElectronFileStore(store);

  ipcMain.handle("get-settings", () => {
    return store.get("settings", {
      providers: {},
      activeProvider: "openai",
      activeModel: "",
      hasSeenOnboarding: false,
      theme: "dark",
      browserAllowedHosts: [],
      terminalShell: "",
    });
  });

  ipcMain.handle("save-settings", (_event, settings: unknown) => {
    store.set("settings", settings);
    return true;
  });

  ipcMain.handle("get-api-key", (_event, provider: string) => {
    const keys = store.get("apiKeys", {}) as Record<string, string>;
    return keys[provider] || "";
  });

  ipcMain.handle("save-api-key", (_event, provider: string, key: string) => {
    const keys = store.get("apiKeys", {}) as Record<string, string>;
    keys[provider] = key;
    store.set("apiKeys", keys);
    return true;
  });

  ipcMain.handle("get-all-api-keys", () => {
    return store.get("apiKeys", {});
  });

  ipcMain.handle("save-attachment", (_event, input: SaveAttachmentInput) => {
    return fileStore.saveAttachment(input);
  });

  ipcMain.handle("read-attachment", (_event, attachmentId: string) => {
    return fileStore.readAttachment(attachmentId);
  });

  ipcMain.handle("open-attachment", (_event, attachmentId: string) => {
    return fileStore.openAttachment(attachmentId);
  });

  ipcMain.handle("delete-attachment", (_event, attachmentId: string) => {
    return fileStore.deleteAttachment(attachmentId);
  });

  ipcMain.handle(IPC_CHANNELS.MEMORY_READ_CORE, () => readCoreMemory());

  ipcMain.handle(
    IPC_CHANNELS.MEMORY_APPEND_CONVERSATION,
    (_event, entry: ConversationEntry) => appendConversation(entry)
  );

  ipcMain.handle(
    IPC_CHANNELS.MEMORY_RUN_COMMAND,
    (_event, input: MemoryCommandInput) => runMemoryCommand(input)
  );
}
