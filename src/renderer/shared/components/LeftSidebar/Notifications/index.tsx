import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { Icon } from "@/utils/icons";
import Modal from "@/components/Modal";
import Settings from "@/components/Settings";
import Notification from "./Notification";

import { settings } from "@/constants/settings";

type NotificationsType = {
    id: string;
    avatar: string;
    content: any;
    time: string;
    category: string;
    online?: boolean;
    new?: boolean;
    url: string;
};

type NotificationsProps = {
    items: NotificationsType[];
    className?: string;
    buttonClassName?: string;
    label?: string;
    labelClassName?: string;
    menuItemsClassName?: string;
    /** When provided, renders only the modal(s) in controlled mode (no button) */
    visible?: boolean;
    onClose?: () => void;
};

const Notifications = ({
    items,
    className,
    buttonClassName,
    label,
    labelClassName,
    menuItemsClassName,
    visible: controlledVisible,
    onClose: controlledOnClose,
}: NotificationsProps) => {
    const [internalVisible, setInternalVisible] = useState<boolean>(false);
    const [visibleSettings, setVisibleSettings] = useState<boolean>(false);

    const isControlled = controlledVisible !== undefined && controlledOnClose;
    const visibleNotifications = isControlled
        ? controlledVisible
        : internalVisible;

    const handleOpenSettings = () => {
        if (isControlled) {
            controlledOnClose();
        } else {
            setInternalVisible(false);
        }
        setVisibleSettings(true);
    };

    return (
        <>
            {!isControlled && (
                <div className={twMerge("relative z-10", className)}>
                    <button
                        className={twMerge(
                            "group relative flex h-10 items-center",
                            buttonClassName
                        )}
                        onClick={() => setInternalVisible(true)}
                        type="button"
                    >
                        <div className="relative flex w-10 h-10 shrink-0 items-center justify-center">
                            <Icon
                                className="stroke-n-4 transition-colors group-hover:stroke-primary-1"
                                name="info-circle"
                            />
                            <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-accent-1"></div>
                        </div>
                        {label && (
                            <span
                                className={twMerge(
                                    "base2 font-semibold text-n-3/75 transition-colors group-hover:text-n-1",
                                    labelClassName
                                )}
                            >
                                {label}
                            </span>
                        )}
                    </button>
                </div>
            )}
            <Modal
                className="md:!p-4"
                classWrap={twMerge(
                    "max-w-[32rem] p-6 md:w-[calc(100vw-2rem)] md:p-4",
                    menuItemsClassName
                )}
                classButtonClose="absolute top-5 right-5 fill-n-4"
                visible={visibleNotifications}
                onClose={() =>
                    isControlled ? controlledOnClose() : setInternalVisible(false)
                }
            >
                <div className="flex justify-between items-center mb-3 pr-10">
                    <div className="h4 md:h5">Notifications</div>
                    <button
                        className="group shrink-0"
                        onClick={handleOpenSettings}
                        type="button"
                    >
                        <Icon
                            className="stroke-n-4 transition-colors group-hover:stroke-primary-1"
                            name="settings"
                        />
                    </button>
                </div>
                <div className="max-h-[31.75rem] -mx-6 px-6 space-y-3 overflow-y-auto scroll-smooth scrollbar-none md:max-h-[21.25rem] md:space-y-6 md:-mx-4 md:px-4">
                    {items.map((notification) => (
                        <Notification
                            key={notification.id}
                            item={notification}
                            onClick={() =>
                            isControlled
                                ? controlledOnClose()
                                : setInternalVisible(false)
                        }
                        />
                    ))}
                </div>
            </Modal>
            <Modal
                className="md:!p-0"
                classWrap="max-w-[48rem] md:min-h-screen-ios md:rounded-none"
                classButtonClose="hidden md:block md:absolute md:top-5 md:right-5 dark:fill-n-4"
                classOverlay="md:bg-n-1"
                visible={visibleSettings}
                onClose={() => setVisibleSettings(false)}
            >
                <Settings items={settings} activeItem={2} />
            </Modal>
        </>
    );
};

export default Notifications;
