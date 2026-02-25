import Image from "@/components/Image";
import { Icon } from "@/utils/icons";

type DocumentProps = {
    value?: string;
    mediaType?: string;
    previewSrc?: string;
    onOpen?: () => void;
};

const Document = ({ value, mediaType, previewSrc, onOpen }: DocumentProps) => {
    const isImage = !!mediaType?.startsWith("image/") && !!previewSrc;

    return (
        <div className="w-16">
            <div className="relative flex items-end h-16 rounded-lg bg-n-2 overflow-hidden dark:bg-n-5">
                {isImage ? (
                    <Image
                        className="object-cover"
                        src={previewSrc}
                        fill
                        alt={value || "Attachment"}
                    />
                ) : (
                    <div className="w-full p-3">
                        <div className="w-8 h-1.5 mb-1.5 rounded-full bg-n-3 dark:bg-n-4/25"></div>
                        <div className="h-1.5 mb-1.5 rounded-full bg-n-3 dark:bg-n-4/25"></div>
                        <div className="h-1.5 rounded-full bg-n-3 dark:bg-n-4/25"></div>
                    </div>
                )}
                {onOpen && (
                    <button
                        className="group absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-n-1 text-0 dark:bg-n-7"
                        type="button"
                        onClick={onOpen}
                        aria-label={`Open ${value || "attachment"}`}
                    >
                        <Icon
                            className="size-3 stroke-n-4 transition-colors group-hover:stroke-primary-1"
                            name="zoom-in"
                        />
                    </button>
                )}
            </div>
            <div className="mt-1.5 caption1 truncate">{value}</div>
        </div>
    );
};

export default Document;
