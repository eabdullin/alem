import { useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "@/components/Image";
import { PLACEHOLDER_AVATAR } from "@/constants/placeholders";
import { Icon } from "@/utils/icons";
import Modal from "@/components/Modal";
import Settings from "@/components/Settings";

import { settings } from "@/constants/settings";

type ProfileProps = {};

const Profile = ({}: ProfileProps) => {
    const [visibleSettings, setVisibleSettings] = useState<boolean>(false);

    const menu = [
        {
            title: "New version available",
            icon: "arrow-down-circle",
            onClick: () => console.log("New version available"),
        },
        {
            title: "Settings",
            icon: "settings-fill",
            onClick: () => setVisibleSettings(true),
        },
        {
            title: "Log out",
            icon: "logout",
            onClick: () => console.log("Log out"),
        },
    ];

    return (
        <>
            <div className="relative z-10 mr-8 lg:mr-6 md:static">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className="relative w-10 h-10 rounded-full transition-shadow data-[state=open]:shadow-[0_0_0_0.25rem_#E9A341]"
                        >
                            <Image
                                className="rounded-full object-cover"
                                src={PLACEHOLDER_AVATAR}
                                fill
                                alt="Avatar"
                            />
                            <div className="absolute -right-0.75 -bottom-0.75 w-4.5 h-4.5 bg-primary-2 rounded-full border-4 border-n-1 dark:border-n-6"></div>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        sideOffset={15}
                        className="w-[19.88rem] p-4 rounded-2xl border border-n-2 shadow-[0px_48px_64px_-16px_rgba(0,0,0,0.25)] md:w-[calc(100vw-4rem)] dark:border-n-5"
                    >
                        <div className="flex items-center mb-3">
                            <div className="relative w-15 h-15">
                                <Image
                                    className="rounded-full object-cover"
                                    src={PLACEHOLDER_AVATAR}
                                    fill
                                    alt="Avatar"
                                />
                                <div className="absolute right-0 bottom-0 w-4.5 h-4.5 bg-primary-2 rounded-full border-4 border-n-1 dark:border-n-7"></div>
                            </div>
                            <div className="pl-4">
                                <div className="h6">Tran Mau Tri Tam</div>
                                <div className="caption1 text-n-4">
                                    Lead visual designer at UI8
                                </div>
                            </div>
                        </div>
                        <div className="px-4 bg-n-2 rounded-xl dark:bg-n-6">
                            {menu.map((item, index) => (
                                <DropdownMenuItem
                                    key={index}
                                    className="h-12 base2 font-semibold cursor-pointer"
                                    onSelect={(e) => {
                                        e.preventDefault();
                                        item.onClick();
                                    }}
                                >
                                    <Icon
                                        className="mr-4 stroke-n-4"
                                        name={item.icon}
                                    />
                                    {item.title}
                                </DropdownMenuItem>
                            ))}
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <Modal
                className="md:!p-0"
                classWrap="max-w-[58.5rem] md:min-h-screen-ios md:rounded-none"
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

export default Profile;
