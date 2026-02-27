# Local Persistence Schema Snapshot

`qurt` currently uses local persistence (not a remote SQL/NoSQL database).

## Sources Of Truth

1. Electron store (`qurt-config`)
2. Browser local storage (`qurt.chat-history.v1`)
3. Attachment file directory (`<userData>/chat-attachments`)

## Electron Store Shape (Current)

```ts
{
  settings: {
    providers: Record<string, unknown>;
    activeProvider: string;
    activeModel: string;
    enabledModels: Record<string, string[]>;
    theme: "dark" | "light" | string;
  };
  apiKeys: Record<string, string>;
  chats: unknown[];
  attachments: Record<
    string,
    {
      id: string;
      name: string;
      mediaType: string;
      size: number;
      relativePath: string;
      createdAt: string;
    }
  >;
}
```

## Chat History Local Storage Shape

```ts
type ChatSession = {
  id: string;
  title: string;
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    attachments?: Array<{
      id: string;
      name: string;
      mediaType: string;
      size: number;
      createdAt?: string;
    }>;
  }>;
  createdAt: string;
  updatedAt: string;
};
```

## Last Updated

- 2026-02-21
