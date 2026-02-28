import { useState, useEffect, useCallback } from "react";
import { disablePageScroll, enablePageScroll } from "scroll-lock";
import { useLocation, useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";
import { Icon } from "@/utils/icons";
import Modal from "@/components/Modal";
import Search from "@/components/Search";
import Settings from "@/components/Settings";
import Notifications from "@/components/LeftSidebar/Notifications";
import Navigation from "./Navigation";
import ChatGroup from "./ChatGroup";
import ToggleTheme from "./ToggleTheme";

import { settings } from "@/constants/settings";
import { OPEN_SETTINGS_MODAL_EVENT } from "@/constants/ui-events";
import { notifications } from "@/mocks/notifications";
import { twMerge } from "tailwind-merge";
import {
    CHAT_GROUPS_UPDATED_EVENT,
    chatGroupService,
} from "@/services/chat-group-service";
import {
    CHAT_HISTORY_UPDATED_EVENT,
    chatService,
} from "@/services/chat-service";

type LeftSidebarProps = {
    value: boolean;
    setValue?: any;
    smallSidebar?: boolean;
    visibleRightSidebar?: boolean;
};

const LeftSidebar = ({
    value,
    setValue,
    smallSidebar,
    visibleRightSidebar,
}: LeftSidebarProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [visibleSearch, setVisibleSearch] = useState<boolean>(false);
    const [visibleSettings, setVisibleSettings] = useState<boolean>(false);
    const [visibleNotifications, setVisibleNotifications] =
        useState<boolean>(false);
    const [chatGroupItems, setChatGroupItems] = useState<
        {
            id: string;
            title: string;
            counter: number;
            color: string;
        }[]
    >([]);

    const activeGroupId =
        new URLSearchParams(location.search).get("list")?.trim() || "";

    useEffect(() => {
        window.addEventListener("keydown", handleWindowKeyDown);
        return () => {
            window.removeEventListener("keydown", handleWindowKeyDown);
        };
    }, []);

    useEffect(() => {
        const handleOpenSettingsModal = () => {
            setVisibleSettings(true);
        };

        window.addEventListener(OPEN_SETTINGS_MODAL_EVENT, handleOpenSettingsModal);

        return () => {
            window.removeEventListener(
                OPEN_SETTINGS_MODAL_EVENT,
                handleOpenSettingsModal
            );
        };
    }, []);

    const loadChatGroups = useCallback(async () => {
        const [groups, counts] = await Promise.all([
            chatGroupService.listChatGroups(),
            chatService.listChatCountsByGroup(),
        ]);

        setChatGroupItems(
            groups.map((group) => ({
                id: group.id,
                title: group.title,
                color: group.color,
                counter: counts[group.id] ?? 0,
            }))
        );
    }, []);

    useEffect(() => {
        const handleGroupsUpdated = () => {
            void loadChatGroups();
        };

        void loadChatGroups();
        window.addEventListener(CHAT_GROUPS_UPDATED_EVENT, handleGroupsUpdated);
        window.addEventListener(CHAT_HISTORY_UPDATED_EVENT, handleGroupsUpdated);

        return () => {
            window.removeEventListener(
                CHAT_GROUPS_UPDATED_EVENT,
                handleGroupsUpdated
            );
            window.removeEventListener(
                CHAT_HISTORY_UPDATED_EVENT,
                handleGroupsUpdated
            );
        };
    }, [loadChatGroups]);

    const handleWindowKeyDown = (event: any) => {
        if (event.metaKey && event.key === "f") {
            event.preventDefault();
            setVisibleSearch(true);
        }
    };

    const chatsNavigation = [
        {
            title: "Chats",
            icon: "chat",
            color: "fill-accent-2",
            url: "/",
        },
    ];

    const navigation = [
        {
            title: "Search",
            icon: "search",
            color: "fill-primary-2",
            onClick: () => setVisibleSearch(true),
        },
        // {
        //     title: "Notifications",
        //     icon: "notification",
        //     color: "fill-accent-1",
        //     onClick: () => setVisibleNotifications(true),
        // },
        {
            title: "Updates & FAQ",
            icon: "barcode",
            color: "fill-accent-1",
            url: "/updates-and-faq",
        },
        {
            title: "Settings",
            icon: "settings",
            color: "fill-accent-3",
            url: "/settings",
        },
    ];

    const settingsNavigation = navigation;

    const handleClick = () => {
        setValue(!value);
        smallSidebar && value ? disablePageScroll() : enablePageScroll();
    };

    const handleSelectChatGroup = (groupId: string) => {
        const listQuery = `?list=${encodeURIComponent(groupId)}`;
        navigate(`/${listQuery}`);
    };

    return (
        <>
            <div
                className={twMerge(
                    `fixed z-20 top-0 left-0 bottom-0 flex flex-col pt-30 px-4 bg-n-7 md:invisible md:opacity-0 md:transition-opacity ${
                        value
                            ? "w-24 pb-38 md:w-16 md:px-0 md:pb-30"
                            : "w-80 pb-58"
                    } ${visibleRightSidebar && "md:visible md:opacity-100"}`
                )}
            >
                <div
                    className={`absolute top-0 right-0 left-0 flex items-center h-30 pl-7 pr-6 ${
                        value ? "justify-center md:px-4" : "justify-between"
                    }`}
                >
                    {!value && <Logo />}
                    <button
                        className="group tap-highlight-color"
                        onClick={handleClick}
                    >
                        <Icon
                            className="stroke-n-4 transition-colors group-hover:stroke-n-3"
                            name={value ? "toggle-on" : "toggle-off"}
                        />
                    </button>
                </div>
                <div className="grow overflow-y-auto scroll-smooth scrollbar-none">
                    <Navigation visible={value} items={chatsNavigation} />
                    <ChatGroup
                        visible={value}
                        items={chatGroupItems}
                        activeGroupId={activeGroupId}
                        onSelectGroup={handleSelectChatGroup}
                        onCreateGroup={async (input) => {
                            await chatGroupService.createChatGroup(input);
                            await loadChatGroups();
                        }}
                    />
                    <div
                        className={`my-4 h-0.25 bg-n-6 ${
                            value ? "-mx-4 md:mx-0" : "-mx-2 md:mx-0"
                        }`}
                    ></div>
                    <Navigation visible={value} items={settingsNavigation} />
                    <Notifications
                        items={notifications}
                        visible={visibleNotifications}
                        onClose={() => setVisibleNotifications(false)}
                    />
                </div>
                <div className="absolute left-0 bottom-0 right-0 pb-6 px-4 bg-n-7 before:absolute before:left-0 before:right-0 before:bottom-full before:h-10 before:bg-gradient-to-t before:from-[#121212] before:to-[rgba(18,18,18,0)] before:pointer-events-none md:px-3">
                    <ToggleTheme visible={value} />
                </div>
            </div>
            <Modal
                className="md:!p-0"
                classWrap="md:min-h-screen-ios md:rounded-none dark:shadow-[inset_0_0_0_0.0625rem_#232627,0_2rem_4rem_-1rem_rgba(0,0,0,0.33)] dark:md:shadow-none"
                classButtonClose="absolute top-5 right-5 flex items-center justify-center w-10 h-10 rounded-full fill-n-4 hover:fill-primary-1 hover:bg-n-2 dark:fill-n-1 dark:hover:bg-n-6 md:top-6 md:right-6"
                classOverlay="md:bg-n-1"
                visible={visibleSearch}
                onClose={() => setVisibleSearch(false)}
            >
                <Search />
            </Modal>
        </>
    );
};

export default LeftSidebar;
