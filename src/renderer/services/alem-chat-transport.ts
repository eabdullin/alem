import {
  DirectChatTransport,
  isFileUIPart,
  type Agent,
  type ChatTransport,
  type UIMessage,
} from "ai";

/** URL prefix for file parts that reference Electron file-store attachments. */
export const ALEM_ATTACHMENT_PREFIX = "alem-attachment://";

function needsResolution(part: { url: string }): boolean {
  return (
    typeof part.url === "string" && part.url.startsWith(ALEM_ATTACHMENT_PREFIX)
  );
}

function getAttachmentId(url: string): string {
  return url.slice(ALEM_ATTACHMENT_PREFIX.length);
}

export interface AlemChatTransportOptions {
  /** Returns the agent to use. Called on each send so apiKey can be fetched fresh. */
  getAgent: () => Promise<Agent>;
  sendReasoning?: boolean;
  /** Resolves an attachment ID to base64 data. Called for file parts with url "alem-attachment://<id>". */
  resolveAttachment: (attachmentId: string) => Promise<string>;
}

/**
 * Transport that wraps DirectChatTransport and resolves Electron file-store
 * attachments before sending to the agent. File parts with url
 * "alem-attachment://<id>" are resolved to data URLs via resolveAttachment.
 * Uses getAgent() so the agent can be created with the current apiKey on each send.
 */
export class AlemChatTransport implements ChatTransport<UIMessage> {
  private readonly getAgent: () => Promise<Agent>;
  private readonly resolveAttachment: (id: string) => Promise<string>;
  private readonly sendReasoning: boolean;

  constructor({
    getAgent,
    sendReasoning = true,
    resolveAttachment,
  }: AlemChatTransportOptions) {
    this.getAgent = getAgent;
    this.resolveAttachment = resolveAttachment;
    this.sendReasoning = sendReasoning;
  }

  async sendMessages(
    options: Parameters<ChatTransport<UIMessage>["sendMessages"]>[0],
  ): Promise<ReadableStream> {
    const agent = await this.getAgent();
    const inner = new DirectChatTransport({
      agent,
      sendReasoning: this.sendReasoning,
      messageMetadata: ({ part }) => {
        if (part.type === "finish" && part.totalUsage) {
          return { totalUsage: part.totalUsage };
        }
        return undefined;
      },
    });
    const resolvedMessages = await this.resolveAttachmentUrls(options.messages);
    return inner.sendMessages({
      ...options,
      messages: resolvedMessages as Parameters<
        DirectChatTransport["sendMessages"]
      >[0]["messages"],
    });
  }

  async reconnectToStream(
    _options: Parameters<ChatTransport<UIMessage>["reconnectToStream"]>[0],
  ): Promise<ReadableStream | null> {
    return null;
  }

  private async resolveAttachmentUrls(
    messages: UIMessage[],
  ): Promise<UIMessage[]> {
    return Promise.all(
      messages.map((msg) => this.resolveMessageAttachments(msg)),
    );
  }

  private async resolveMessageAttachments(message: UIMessage): Promise<UIMessage> {
    const resolvedParts = await Promise.all(
      message.parts.map((part) => this.resolvePart(part)),
    );
    return { ...message, parts: resolvedParts };
  }

  private async resolvePart(
    part: UIMessage["parts"][number],
  ): Promise<UIMessage["parts"][number]> {
    if (!isFileUIPart(part) || !needsResolution(part)) {
      return part;
    }

    const attachmentId = getAttachmentId(part.url);
    const base64 = await this.resolveAttachment(attachmentId);
    const dataUrl = `data:${part.mediaType};base64,${base64}`;

    return { ...part, url: dataUrl };
  }
}
