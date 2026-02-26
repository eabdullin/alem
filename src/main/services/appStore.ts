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
        },
        apiKeys: {},
        chats: [],
        attachments: {},
      },
    });
  }
  return store;
}
