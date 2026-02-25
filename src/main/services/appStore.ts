import Store from "electron-store";

let store: Store<any> | null = null;

export function getStore(): Store<any> {
  if (!store) {
    store = new Store({
      name: "alem-config",
      defaults: {
        settings: {
          providers: {},
          activeProvider: "openai",
          activeModel: "gpt-5-mini",
          enabledModels: {
            openai: ["gpt-5-mini"],
            anthropic: ["claude-sonnet-4-6"],
            google: ["gemini-3-flash-preview"],
          },
          theme: "dark",
        },
        apiKeys: {},
        chats: [],
        attachments: {},
      },
    });
  }
  return store;
}
