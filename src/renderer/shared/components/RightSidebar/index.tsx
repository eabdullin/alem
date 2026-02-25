import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import { toast } from "react-hot-toast";
import { Icon } from "@/utils/icons";
import Notify from "@/components/Notify";
import ChatItem from "./ChatItem";
import ChatEmpty from "./ChatEmpty";

import {
    CHAT_HISTORY_UPDATED_EVENT,
    chatService,
    type ChatHistoryListItem,
} from "@/services/chat-service";
import { ARCHIVED_CHAT_GROUP_ID } from "@/services/chat-group-service";

type RightSidebarProps = {
    className?: string;
    visible?: boolean;
};

const RightSidebar = ({ className, visible }: RightSidebarProps) => {
    const location = useLocation();
    const [chatItems, setChatItems] = useState<ChatHistoryListItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [selectedChatIds, setSelectedChatIds] = useState<string[]>([]);

    const activeListId =
        new URLSearchParams(location.search).get("list")?.trim() || "";

    const loadChats = useCallback(async () => {
        setIsLoading(true);
        const items = await chatService.listChats({
            groupId: activeListId || undefined,
        });
        setChatItems(items);
        setIsLoading(false);
    }, [activeListId]);

    useEffect(() => {
        const handleChatHistoryUpdated = () => {
            void loadChats();
        };

        void loadChats();
        window.addEventListener(
            CHAT_HISTORY_UPDATED_EVENT,
            handleChatHistoryUpdated
        );

        return () => {
            window.removeEventListener(
                CHAT_HISTORY_UPDATED_EVENT,
                handleChatHistoryUpdated
            );
        };
    }, [loadChats]);

    useEffect(() => {
        const availableChatIds = new Set(chatItems.map((chat) => chat.id));
        setSelectedChatIds((current) =>
            current.filter((chatId) => availableChatIds.has(chatId))
        );
    }, [chatItems]);

    const toggleSelectedChat = (chatId: string) => {
        setSelectedChatIds((current) =>
            current.includes(chatId)
                ? current.filter((id) => id !== chatId)
                : [...current, chatId]
        );
    };

    const handleArchiveChats = async (chatIds: string[], t: any) => {
        if (chatIds.length === 0) {
            toast.dismiss(t.id);
            return;
        }

        await chatService.archiveChats(chatIds);
        setSelectedChatIds([]);
        toast.dismiss(t.id);
    };

    const handleDeleteChats = async (chatIds: string[], t: any) => {
        if (chatIds.length === 0) {
            toast.dismiss(t.id);
            return;
        }

        await chatService.deleteChats(chatIds);
        setSelectedChatIds([]);
        toast.dismiss(t.id);
    };

    const selectedChats = chatItems.filter((item) =>
        selectedChatIds.includes(item.id)
    );
    const archivableSelectedChatIds = selectedChats
        .filter((item) => !item.isArchived)
        .map((item) => item.id);
    const hasSelectedChats = selectedChats.length > 0;
    const hasArchivableSelectedChats = archivableSelectedChatIds.length > 0;
    const isArchivedGroup = activeListId === ARCHIVED_CHAT_GROUP_ID;

    return (
        <div
            className={twMerge(
                `absolute top-0 right-0 bottom-0 flex flex-col w-[22.5rem] pt-18 pb-24 bg-n-1 rounded-r-[1.25rem] border-l border-n-3 shadow-[inset_0_1.5rem_3.75rem_rgba(0,0,0,0.1)] 2xl:w-80 lg:rounded-[1.25rem] lg:invisible lg:opacity-0 lg:transition-opacity lg:z-20 lg:border-l-0 lg:shadow-2xl md:fixed md:w-[calc(100%-4rem)] md:border-l md:rounded-none dark:bg-n-6 dark:border-n-5 ${
                    visible && "lg:visible lg:opacity-100"
                } ${className}`
            )}
        >
            <div className="absolute top-0 left-0 right-0 flex items-center h-18 px-9 border-b border-n-3 lg:pr-18 md:pr-16 dark:border-n-5">
                <div className="base2 text-n-4/75">Chat history</div>
                <div className="ml-3 px-2 bg-n-3 rounded-lg caption1 text-n-4 dark:bg-n-5/50">
                    {isLoading ? "..." : chatItems.length}
                </div>
                {hasSelectedChats && hasArchivableSelectedChats && (
                    <button
                        className="group relative ml-auto text-0"
                        onClick={() => {
                            const chatIds = [...archivableSelectedChatIds];
                            const selectedChatCountLabel =
                                chatIds.length === 1
                                    ? "this chat"
                                    : `${chatIds.length} chats`;
                            toast((t) => (
                                <Notify className="md:flex-col md:items-center md:px-10" iconCheck>
                                    <div className="ml-3 mr-6 h6 md:mx-0 md:my-2">
                                        Archive {selectedChatCountLabel}?
                                    </div>
                                    <div className="flex justify-center">
                                        <button
                                            className="btn-stroke-light btn-medium md:min-w-[6rem]"
                                            onClick={() => toast.dismiss(t.id)}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="btn-blue btn-medium ml-3 md:min-w-[6rem]"
                                            onClick={() =>
                                                handleArchiveChats(chatIds, t)
                                            }
                                        >
                                            Archive
                                        </button>
                                    </div>
                                </Notify>
                            ));
                        }}
                    >
                        <Icon
                            className="size-5 stroke-n-4 transition-colors group-hover:stroke-primary-1"
                            name="archive"
                        />
                        <div className="absolute min-w-[8rem] top-1/2 -translate-y-1/2 right-full mr-2 px-2 py-1 rounded-lg bg-n-7 caption1 text-n-1 invisible opacity-0 transition-opacity pointer-events-none lg:hidden after:absolute after:top-1/2 after:left-full after:-translate-y-1/2 after:w-0 after:h-0 after:border-t-4 after:border-l-4 after:border-b-4 after:border-r-4 after:border-r-transparent after:border-l-n-7 after:border-t-transparent after:border-b-transparent group-hover:opacity-100 group-hover:visible">
                            Archive selected chats
                        </div>
                    </button>
                )}
                {hasSelectedChats && (
                    <button
                        className="group relative ml-3 text-0"
                        onClick={() => {
                            const chatIds = [...selectedChatIds];
                            const selectedChatCountLabel =
                                chatIds.length === 1
                                    ? "this chat"
                                    : `${chatIds.length} chats`;
                            toast((t) => (
                                <Notify
                                    className="md:flex-col md:items-center md:px-10"
                                    iconDelete
                                >
                                    <div className="ml-3 mr-6 h6 md:mx-0 md:my-2">
                                        Delete {selectedChatCountLabel}?
                                    </div>
                                    <div className="flex justify-center">
                                        <button
                                            className="btn-stroke-light btn-medium md:min-w-[6rem]"
                                            onClick={() =>
                                                toast.dismiss(t.id)
                                            }
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="btn-blue btn-medium ml-3 md:min-w-[6rem]"
                                            onClick={() =>
                                                handleDeleteChats(chatIds, t)
                                            }
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </Notify>
                            ));
                        }}
                    >
                        <Icon
                            className="size-5 stroke-n-4 transition-colors group-hover:stroke-accent-1"
                            name="trash"
                        />
                        <div className="absolute min-w-[8rem] top-1/2 -translate-y-1/2 right-full mr-2 px-2 py-1 rounded-lg bg-n-7 caption1 text-n-1 invisible opacity-0 transition-opacity pointer-events-none lg:hidden after:absolute after:top-1/2 after:left-full after:-translate-y-1/2 after:w-0 after:h-0 after:border-t-4 after:border-l-4 after:border-b-4 after:border-r-4 after:border-r-transparent after:border-l-n-7 after:border-t-transparent after:border-b-transparent group-hover:opacity-100 group-hover:visible">
                            Delete selected chats
                        </div>
                    </button>
                )}
            </div>
            <div className="grow overflow-y-auto scroll-smooth px-6 md:px-3">
                {!isLoading && chatItems.length === 0 ? (
                    <ChatEmpty />
                ) : (
                    chatItems.map((item) => (
                        <ChatItem
                            item={item}
                            key={item.id}
                            active={selectedChatIds.includes(item.id)}
                            onToggleActive={toggleSelectedChat}
                        />
                    ))
                )}
            </div>
            <div className="absolute left-0 right-0 bottom-0 p-6">
                {isArchivedGroup ? (
                    <button
                        className="btn-blue w-full opacity-50 cursor-not-allowed"
                        disabled
                    >
                        <Icon name="plus" />
                        <span>New chat</span>
                    </button>
                ) : (
                    <Link
                        className="btn-blue w-full"
                        to={
                            activeListId
                                ? `/?list=${encodeURIComponent(activeListId)}`
                                : "/"
                        }
                    >
                        <Icon name="plus" />
                        <span>New chat</span>
                    </Link>
                )}
            </div>
        </div>
    );
};

export default RightSidebar;
