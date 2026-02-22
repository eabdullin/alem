import type { ComponentType, SVGProps } from "react";
import {
    ArchiveBoxIcon,
    ArrowDownCircleIcon,
    ArrowDownTrayIcon,
    ArrowLeftIcon,
    ArrowPathIcon,
    ArrowRightIcon,
    ArrowRightStartOnRectangleIcon,
    ArrowTopRightOnSquareIcon,
    ArrowUpIcon,
    ArrowUpTrayIcon,
    ArrowsRightLeftIcon,
    BellIcon,
    CalendarDaysIcon,
    ChatBubbleLeftRightIcon,
    ChatBubbleLeftEllipsisIcon,
    CheckBadgeIcon,
    CheckCircleIcon,
    CheckIcon,
    ChevronDownIcon,
    CircleStackIcon,
    ClockIcon,
    Cog6ToothIcon,
    CommandLineIcon,
    CreditCardIcon,
    CubeIcon,
    DocumentDuplicateIcon,
    EllipsisHorizontalIcon,
    EnvelopeIcon,
    HandThumbDownIcon,
    HandThumbUpIcon,
    InformationCircleIcon,
    LinkIcon,
    LockClosedIcon,
    MagnifyingGlassIcon,
    MagnifyingGlassPlusIcon,
    MapPinIcon,
    MoonIcon,
    MusicalNoteIcon,
    PauseCircleIcon,
    PauseIcon,
    PencilSquareIcon,
    PhotoIcon,
    PlayCircleIcon,
    PlayIcon,
    PlusCircleIcon,
    PlusIcon,
    QrCodeIcon,
    QuestionMarkCircleIcon,
    ScaleIcon,
    ShareIcon,
    SpeakerWaveIcon,
    Squares2X2Icon,
    StarIcon,
    SunIcon,
    TrashIcon,
    TrophyIcon,
    UserCircleIcon,
    UserIcon,
    UserPlusIcon,
    XCircleIcon,
    XMarkIcon,
} from "@heroicons/react/24/solid";
import { twMerge } from "tailwind-merge";

type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;

type IconProps = Omit<SVGProps<SVGSVGElement>, "name"> & {
    name?: string;
};

const ToggleOnIcon: HeroIcon = ({ fill, ...props }: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" width={24} height={24} {...props}>
        <path fill={fill} d="M19.5 2A2.5 2.5 0 0 1 22 4.5v15a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 19.5v-15A2.5 2.5 0 0 1 4.5 2h15zM18 4h-4a2 2 0 0 0-2 2h0v12a2 2 0 0 0 2 2h0 4a2 2 0 0 0 2-2h0V6a2 2 0 0 0-2-2h0zM9.121 9.707a1 1 0 0 0-1.517 1.294h0L5 11a1 1 0 1 0 0 2h0l2.828-.001-.121.122a1 1 0 0 0 1.414 1.414h0l1.414-1.414c.271-.271.354-.659.25-1.002a1 1 0 0 0-.25-.998h0z" />
    </svg>
);

const ToggleOffIcon: HeroIcon = ({ fill, ...props }: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" width={24} height={24} {...props}>
        <path fill={fill} d="M19.5 2A2.5 2.5 0 0 1 22 4.5v15a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 19.5v-15A2.5 2.5 0 0 1 4.5 2h15zM10 4H6a2 2 0 0 0-2 2h0v12a2 2 0 0 0 2 2h0 4a2 2 0 0 0 2-2h0V6a2 2 0 0 0-2-2h0z" />
    </svg>
);

const iconMap: Record<string, HeroIcon> = {
    archive: ArchiveBoxIcon,
    "arrow-down-circle": ArrowDownCircleIcon,
    "arrow-down": ChevronDownIcon,
    "arrow-next": ArrowRightIcon,
    "arrow-prev": ArrowLeftIcon,
    "arrow-up": ArrowUpIcon,
    barcode: QrCodeIcon,
    "branch-split": ArrowsRightLeftIcon,
    box: CubeIcon,
    calendar: CalendarDaysIcon,
    "calendar-check": CalendarDaysIcon,
    chat: ChatBubbleLeftEllipsisIcon,
    "chat-1": ChatBubbleLeftRightIcon,
    check: CheckIcon,
    "check-circle": CheckCircleIcon,
    "check-thin": CheckIcon,
    clock: ClockIcon,
    close: XMarkIcon,
    "close-fat": XMarkIcon,
    codepen: CommandLineIcon,
    copy: DocumentDuplicateIcon,
    "credit-card": CreditCardIcon,
    dataflow: CircleStackIcon,
    "delete-chat": TrashIcon,
    dots: EllipsisHorizontalIcon,
    download: ArrowDownTrayIcon,
    "download-fill": ArrowDownTrayIcon,
    duplicate: DocumentDuplicateIcon,
    edit: PencilSquareIcon,
    email: EnvelopeIcon,
    "external-link": ArrowTopRightOnSquareIcon,
    "image-check": PhotoIcon,
    "image-up": ArrowUpTrayIcon,
    "info-circle": InformationCircleIcon,
    invite: UserPlusIcon,
    link: LinkIcon,
    lock: LockClosedIcon,
    logout: ArrowRightStartOnRectangleIcon,
    marker: MapPinIcon,
    moon: MoonIcon,
    "music-note": MusicalNoteIcon,
    notification: BellIcon,
    pause: PauseIcon,
    "pause-circle": PauseCircleIcon,
    plan: Squares2X2Icon,
    play: PlayIcon,
    "play-circle": PlayCircleIcon,
    plus: PlusIcon,
    "plus-circle": PlusCircleIcon,
    "plus-circle-stroke": PlusCircleIcon,
    profile: UserIcon,
    "profile-1": UserCircleIcon,
    refresh: ArrowPathIcon,
    scale: ScaleIcon,
    search: MagnifyingGlassIcon,
    "search-1": MagnifyingGlassIcon,
    settings: Cog6ToothIcon,
    "settings-fill": Cog6ToothIcon,
    share: ShareIcon,
    "share-1": ShareIcon,
    star: StarIcon,
    "star-fill": StarIcon,
    "star-rating": StarIcon,
    sun: SunIcon,
    terminal: CommandLineIcon,
    "thumbs-down": HandThumbDownIcon,
    "thumbs-up": HandThumbUpIcon,
    time: ClockIcon,
    "toggle-on": ToggleOnIcon,
    "toggle-off": ToggleOffIcon,
    trash: TrashIcon,
    trophy: TrophyIcon,
    "user-check": CheckBadgeIcon,
    volume: SpeakerWaveIcon,
    "zoom-in": MagnifyingGlassPlusIcon,
};

const Icon = ({ name, className, ...props }: IconProps) => {
    if (!name) {
        return null;
    }

    const HeroIcon = iconMap[name] ?? QuestionMarkCircleIcon;

    return <HeroIcon className={twMerge("inline-block w-6 h-6", className)} {...props} />;
};

export default Icon;
