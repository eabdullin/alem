import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/utils/icons";
import Modal from "@/components/Modal";
import Notify from "@/components/Notify";
import {
    ARCHIVED_CHAT_GROUP_ID,
    chatGroupService,
} from "@/services/chat-group-service";
import { chatService } from "@/services/chat-service";

type ActionsProps = {
    chatId: string;
    chatGroupIds: string[];
};

const Actions = ({ chatId, chatGroupIds }: ActionsProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [favorite, setFavorite] = useState<boolean>(false);
    const [visibleAddToGroupModal, setVisibleAddToGroupModal] =
        useState<boolean>(false);
    const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);
    const [isLoadingLists, setIsLoadingLists] = useState<boolean>(false);
    const [isAddingGroupId, setIsAddingGroupId] = useState<string | null>(null);
    const [listError, setListError] = useState<string>("");
    const [assignedGroupIds, setAssignedGroupIds] = useState<string[]>(chatGroupIds);
    const [lists, setLists] = useState<
        {
            id: string;
            title: string;
            color: string;
        }[]
    >([]);

    useEffect(() => {
        setAssignedGroupIds(chatGroupIds);
    }, [chatGroupIds]);

    const loadAssignableLists = async () => {
        setIsLoadingLists(true);
        setListError("");

        try {
            const allGroups = await chatGroupService.listChatGroups();
            setLists(
                allGroups
                    .filter((group) => group.id !== ARCHIVED_CHAT_GROUP_ID)
                    .map((group) => ({
                        id: group.id,
                        title: group.title,
                        color: group.color,
                    }))
            );
        } catch (error) {
            setListError(
                error instanceof Error
                    ? error.message
                    : "Failed to load groups."
            );
        } finally {
            setIsLoadingLists(false);
        }
    };

    const handleAddToGroup = async (groupId: string) => {
        if (assignedGroupIds.includes(groupId) || isAddingGroupId) {
            return;
        }

        setIsAddingGroupId(groupId);
        setListError("");
        try {
            const updatedChat = await chatService.addChatToGroup(chatId, groupId);
            if (updatedChat) {
                setAssignedGroupIds(updatedChat.chatGroupIds);
            }
        } catch (error) {
            setListError(
                error instanceof Error
                    ? error.message
                    : "Failed to add chat to group."
            );
        } finally {
            setIsAddingGroupId(null);
        }
    };

    const activeListId =
        new URLSearchParams(location.search).get("list")?.trim() || "";
    const listQuery = activeListId
        ? `?list=${encodeURIComponent(activeListId)}`
        : "";

    const handleDuplicateChat = async () => {
        if (isProcessingAction) {
            return;
        }

        setIsProcessingAction(true);
        try {
            const duplicatedChat = await chatService.duplicateChat(chatId);
            if (!duplicatedChat) {
                return;
            }

            navigate(`/chat/${duplicatedChat.id}${listQuery}`);
        } finally {
            setIsProcessingAction(false);
        }
    };

    const handleDeleteChat = () => {
        if (isProcessingAction) {
            return;
        }

        toast((t) => (
            <Notify
                className="md:flex-col md:items-center md:px-10"
                iconDelete
            >
                <div className="ml-3 mr-6 h6 md:mx-0 md:my-2">
                    Delete this chat?
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
                        onClick={async () => {
                            toast.dismiss(t.id);
                            setIsProcessingAction(true);
                            try {
                                await chatService.deleteChats([chatId]);

                                if (activeListId) {
                                    const latestChat =
                                        await chatService.getLatestChatInGroup(
                                            activeListId
                                        );
                                    if (latestChat) {
                                        navigate(
                                            `/chat/${latestChat.id}${listQuery}`,
                                            { replace: true }
                                        );
                                        return;
                                    }
                                }

                                navigate(
                                    activeListId ? `/${listQuery}` : "/",
                                    { replace: true }
                                );
                            } finally {
                                setIsProcessingAction(false);
                            }
                        }}
                    >
                        Delete
                    </button>
                </div>
            </Notify>
        ));
    };

    const menu = [
        {
            id: "0",
            title: "Add to favorite group",
            icon: "star",
            onClick: () => setFavorite(!favorite),
        },
        {
            id: "1",
            title: "Add to group",
            icon: "plus-circle",
            onClick: async () => {
                setVisibleAddToGroupModal(true);
                await loadAssignableLists();
            },
        },
        {
            id: "2",
            title: "Duplicate chat",
            icon: "duplicate",
            onClick: () => void handleDuplicateChat(),
        },
        {
            id: "4",
            title: "Delete chat",
            icon: "delete-chat",
            onClick: () => void handleDeleteChat(),
        },
    ];

    return (
        <>
            <div className="relative z-10 ml-6 md:ml-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className="group relative w-8 h-8 data-[state=open]:[&_svg]:stroke-primary-1"
                        >
                            <Icon
                                className="stroke-n-4 transition-colors group-hover:stroke-primary-1"
                                name="dots"
                            />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-[13.75rem] p-3"
                    >
                        {menu.map((item, index) => (
                            <DropdownMenuItem
                                key={index}
                                className="h-12 px-3 rounded-lg base1 font-semibold cursor-pointer"
                                onSelect={(e) => {
                                    e.preventDefault();
                                    item.onClick();
                                }}
                            >
                                <Icon
                                    className={`shrink-0 mr-3 stroke-n-4 ${
                                        item.id === "0" && favorite
                                            ? "!stroke-accent-5"
                                            : ""
                                    }`}
                                    name={
                                        item.id === "0"
                                            ? favorite
                                                ? "star-fill"
                                                : item.icon
                                            : item.icon
                                    }
                                />
                                {item.title}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <Modal
                className="md:!p-0"
                classWrap="max-w-[32rem] md:min-h-screen-ios md:rounded-none"
                classButtonClose="absolute top-6 right-6 w-10 h-10 rounded-full bg-n-2 md:right-5 dark:bg-n-4/25 dark:fill-n-4 dark:hover:fill-n-1"
                visible={visibleAddToGroupModal}
                onClose={() => setVisibleAddToGroupModal(false)}
            >
                <div className="p-8 md:px-5 md:py-6">
                    <div className="mb-6 h5">Add to group</div>
                    {isLoadingLists ? (
                        <div className="base2 text-n-4/75">Loading groups...</div>
                    ) : lists.length === 0 ? (
                        <div className="base2 text-n-4/75">
                            No groups available.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {lists.map((group) => {
                                const isAssigned = assignedGroupIds.includes(
                                    group.id
                                );
                                const isSaving = isAddingGroupId === group.id;

                                return (
                                    <button
                                        key={group.id}
                                        className="flex items-center w-full rounded-xl px-3 py-3 transition-colors bg-n-2 hover:bg-n-3 dark:bg-n-6 dark:hover:bg-n-5 disabled:cursor-not-allowed disabled:opacity-70"
                                        onClick={() =>
                                            handleAddToGroup(group.id)
                                        }
                                        disabled={isAssigned || !!isAddingGroupId}
                                    >
                                        <div
                                            className="mr-3 h-3.5 w-3.5 rounded"
                                            style={{
                                                backgroundColor: group.color,
                                            }}
                                        ></div>
                                        <div className="mr-auto base1 font-semibold">
                                            {group.title}
                                        </div>
                                        <div className="base2 text-n-4">
                                            {isAssigned
                                                ? "Added"
                                                : isSaving
                                                ? "Adding..."
                                                : "Add"}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    {listError && (
                        <div className="mt-4 rounded-xl bg-accent-1/10 px-4 py-3 base2 text-accent-1">
                            {listError}
                        </div>
                    )}
                </div>
            </Modal>
        </>
    );
};

export default Actions;
