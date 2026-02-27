import Store from "electron-store";

let store: Store<any> | null = null;

export function getStore(): Store<any> {
  if (!store) {
    store = new Store({
      name: "qurt-config",
      defaults: {
        settings: {
          providers: {},
          activeProvider: "openai",
          activeModel: "",
          hasSeenOnboarding: false,
          enabledModels: {
            openai: [],
            anthropic: [],
            google: [],
            moonshotai: [],
            xai: [],
          },
          theme: "dark",
          /** Custom shell for terminal tool. Empty = platform default (PowerShell on Windows, /bin/sh on Unix). */
          terminalShell: "",
        },
        apiKeys: {},
        chats: [],
        attachments: {},
      },
    });
  }
  return store;
}
