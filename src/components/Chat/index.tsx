import { useCallback, useState } from "react";
import Icon from "@/components/Icon";
import ModalShareChat from "@/components/ModalShareChat";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  messagesToMarkdown,
  type ConversationMessage,
} from "@/components/ai-elements/conversation";
import Actions from "./Actions";

type ChatProps = {
  chatId: string;
  chatListIds: string[];
  title: string;
  children: React.ReactNode;
  downloadMessages?: ConversationMessage[];
};

const Chat = ({
  chatId,
  chatListIds,
  title,
  children,
  downloadMessages = [],
}: ChatProps) => {
  const [favorite, setFavorite] = useState<boolean>(false);
  const [visibleModal, setVisibleModal] = useState<boolean>(false);
  const hasDownloadableMessages = downloadMessages.length > 0;

  const handleDownloadConversation = useCallback(() => {
    if (downloadMessages.length === 0) {
      return;
    }

    const markdown = messagesToMarkdown(downloadMessages);
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "conversation.md";
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [downloadMessages]);

  return (
    <>
      <div className="flex items-center min-h-[4.5rem] px-10 pr-20 py-3 border-b border-n-3 shadow-[0_0.75rem_2.5rem_-0.75rem_rgba(0,0,0,0.06)] 2xl:px-6 2xl:pr-20 lg:-mt-18 lg:pr-20 md:pl-5 md:pr-18 dark:border-n-5 dark:shadow-[0_0.75rem_2.5rem_-0.75rem_rgba(0,0,0,0.15)]">
        <div className="mr-auto h5 truncate md:h6">{title}</div>
        <div className="flex items-center ml-6 gap-3">
          <button
            className="group w-8 h-8 md:hidden"
            onClick={() => setFavorite(!favorite)}
          >
            <Icon
              className={`${
                favorite
                  ? "fill-accent-5"
                  : "fill-n-4 transition-colors group-hover:fill-accent-5"
              }`}
              name={favorite ? "star-fill" : "star"}
            />
          </button>
          {hasDownloadableMessages && (
            <button
              className="group w-8 h-8"
              onClick={handleDownloadConversation}
              title="Download conversation"
              type="button"
            >
              <Icon
                className="fill-n-4 transition-colors group-hover:fill-primary-1"
                name="download"
              />
            </button>
          )}
          <Actions chatId={chatId} chatListIds={chatListIds} />
        </div>
      </div>
      <Conversation className="relative z-2 grow">
        <ConversationContent className="gap-10 p-10 2xl:p-6 md:p-5">
          {children}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <ModalShareChat
        visible={visibleModal}
        onClose={() => setVisibleModal(false)}
      />
    </>
  );
};

export default Chat;
