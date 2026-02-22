import { useState, useEffect, useCallback } from "react";
import { Tab } from "@headlessui/react";
import { disablePageScroll, enablePageScroll } from "scroll-lock";
import { useLocation, useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";
import Icon from "@/components/Icon";
import Modal from "@/components/Modal";
import Search from "@/components/Search";
import Settings from "@/components/Settings";
import Notifications from "@/components/LeftSidebar/Notifications";
import Navigation from "./Navigation";
import ChatList from "./ChatList";
import ToggleTheme from "./ToggleTheme";
import Faq from "@/pages/UpdatesAndFaqPage/Faq";
import Updates from "@/pages/UpdatesAndFaqPage/Updates";

import { settings } from "@/constants/settings";
import { notifications } from "@/mocks/notifications";
import { twMerge } from "tailwind-merge";
import {
    CHAT_LISTS_UPDATED_EVENT,
    chatListService,
} from "@/services/chat-list-service";
import {
    CHAT_HISTORY_UPDATED_EVENT,
    chatService,
} from "@/services/chat-service";
import {
    updatesFaqService,
    type FaqItem,
    type UpdateItem,
} from "@/services/updates-faq-service";

const updatesFaqTabNavigation = ["Updates", "FAQ"];

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
    const [visibleUpdatesFaq, setVisibleUpdatesFaq] = useState<boolean>(false);
    const [faqItems, setFaqItems] = useState<FaqItem[]>([]);
    const [updateItems, setUpdateItems] = useState<UpdateItem[]>([]);
    const [chatListItems, setChatListItems] = useState<
        {
            id: string;
            title: string;
            counter: number;
            color: string;
        }[]
    >([]);

    const activeListId =
        new URLSearchParams(location.search).get("list")?.trim() || "";

    useEffect(() => {
        window.addEventListener("keydown", handleWindowKeyDown);
        return () => {
            window.removeEventListener("keydown", handleWindowKeyDown);
        };
    }, []);

    const loadChatLists = useCallback(async () => {
        const [lists, counts] = await Promise.all([
            chatListService.listChatLists(),
            chatService.listChatCountsByList(),
        ]);

        setChatListItems(
            lists.map((list) => ({
                id: list.id,
                title: list.title,
                color: list.color,
                counter: counts[list.id] ?? 0,
            }))
        );
    }, []);

    useEffect(() => {
        const handleListsUpdated = () => {
            void loadChatLists();
        };

        void loadChatLists();
        window.addEventListener(CHAT_LISTS_UPDATED_EVENT, handleListsUpdated);
        window.addEventListener(CHAT_HISTORY_UPDATED_EVENT, handleListsUpdated);

        return () => {
            window.removeEventListener(
                CHAT_LISTS_UPDATED_EVENT,
                handleListsUpdated
            );
            window.removeEventListener(
                CHAT_HISTORY_UPDATED_EVENT,
                handleListsUpdated
            );
        };
    }, [loadChatLists]);

    useEffect(() => {
        let active = true;

        const loadUpdatesFaq = async () => {
            const content = await updatesFaqService.getContent();
            if (!active) {
                return;
            }

            setFaqItems(content.faqItems);
            setUpdateItems(content.updateItems);
        };

        void loadUpdatesFaq();

        return () => {
            active = false;
        };
    }, []);

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
        {
            title: "Updates & FAQ",
            icon: "barcode",
            color: "fill-accent-1",
            onClick: () => setVisibleUpdatesFaq(true),
        },
    ];

    const settingsNavigation = [
        {
            title: "Settings",
            icon: "settings",
            color: "fill-accent-3",
            onClick: () => setVisibleSettings(true),
        },
    ];

    const handleClick = () => {
        setValue(!value);
        smallSidebar && value ? disablePageScroll() : enablePageScroll();
    };

    const handleSelectChatList = (listId: string) => {
        const listQuery = `?list=${encodeURIComponent(listId)}`;
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
                            className="fill-n-4 transition-colors group-hover:fill-n-3"
                            name={value ? "toggle-on" : "toggle-off"}
                        />
                    </button>
                </div>
                <div className="grow overflow-y-auto scroll-smooth scrollbar-none">
                    <Navigation visible={value} items={chatsNavigation} />
                    <ChatList
                        visible={value}
                        items={chatListItems}
                        activeListId={activeListId}
                        onSelectList={handleSelectChatList}
                        onCreateList={async (input) => {
                            await chatListService.createChatList(input);
                            await loadChatLists();
                        }}
                    />
                    <div
                        className={`my-4 h-0.25 bg-n-6 ${
                            value ? "-mx-4 md:mx-0" : "-mx-2 md:mx-0"
                        }`}
                    ></div>
                    <Navigation visible={value} items={navigation} />
                    <div className={value ? "px-2" : ""}>
                        <Notifications
                            items={notifications}
                            className="w-full"
                            buttonClassName={`w-full h-12 rounded-lg transition-colors hover:bg-n-6 ${
                                value ? "justify-center px-3" : "px-5"
                            }`}
                            label={!value ? "Notifications" : undefined}
                            labelClassName="ml-5"
                        />
                    </div>
                    <Navigation visible={value} items={settingsNavigation} />
                </div>
                <div className="absolute left-0 bottom-0 right-0 pb-6 px-4 bg-n-7 before:absolute before:left-0 before:right-0 before:bottom-full before:h-10 before:bg-gradient-to-t before:from-[#131617] before:to-[rgba(19,22,23,0)] before:pointer-events-none md:px-3">
                    <ToggleTheme visible={value} />
                </div>
            </div>
            <Modal
                className="md:!p-0"
                classWrap="max-w-[62rem] md:min-h-screen-ios md:rounded-none"
                classButtonClose="absolute top-5 right-5 fill-n-4 md:top-6 md:right-6"
                classOverlay="md:bg-n-1"
                visible={visibleUpdatesFaq}
                onClose={() => setVisibleUpdatesFaq(false)}
            >
                <div className="p-16 md:pt-8 md:px-6 md:pb-10">
                    <div className="max-w-[58.5rem] mx-auto">
                        <div className="mb-4 h2 md:pr-16 md:h3">
                            Updates & FAQ
                        </div>
                        <div className="mb-12 body1 text-n-4 md:mb-6">
                            Features, fixes & improvements.
                        </div>
                        <Tab.Group defaultIndex={0}>
                            <Tab.List className="mb-12 md:mb-6 space-x-3">
                                {updatesFaqTabNavigation.map((button) => (
                                    <Tab
                                        className="h-10 px-6 rounded-full base1 text-n-4 transition-colors outline-none tap-highlight-color hover:text-n-7 ui-selected:bg-primary-1 ui-selected:!text-n-1 dark:hover:text-n-1"
                                        key={button}
                                    >
                                        {button}
                                    </Tab>
                                ))}
                            </Tab.List>
                            <Tab.Panels>
                                <Tab.Panel>
                                    <Updates items={updateItems} />
                                </Tab.Panel>
                                <Tab.Panel>
                                    <Faq items={faqItems} />
                                </Tab.Panel>
                            </Tab.Panels>
                        </Tab.Group>
                    </div>
                </div>
            </Modal>
            <Modal
                className="md:!p-0"
                classWrap="md:min-h-screen-ios md:rounded-none dark:shadow-[inset_0_0_0_0.0625rem_#232627,0_2rem_4rem_-1rem_rgba(0,0,0,0.33)] dark:md:shadow-none"
                classButtonClose="hidden md:flex md:absolute md:top-6 md:left-6 dark:fill-n-1"
                classOverlay="md:bg-n-1"
                visible={visibleSearch}
                onClose={() => setVisibleSearch(false)}
            >
                <Search />
            </Modal>
            <Modal
                className="md:!p-0"
                classWrap="max-w-[48rem] md:min-h-screen-ios md:rounded-none"
                classButtonClose="hidden md:block md:absolute md:top-5 md:right-5 dark:fill-n-4"
                classOverlay="md:bg-n-1"
                visible={visibleSettings}
                onClose={() => setVisibleSettings(false)}
            >
                <Settings items={settings} />
            </Modal>
        </>
    );
};

export default LeftSidebar;
