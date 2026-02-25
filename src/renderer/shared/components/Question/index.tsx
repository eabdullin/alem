import { useEffect, useMemo, useState } from "react";
import Image from "@/components/Image";
import type { ChatAttachment } from "@/types/chat-attachment";
import Document from "./Document";

type QuestionProps = {
    content: any;
    image?: string;
    document?: string;
    documents?: string[];
    attachments?: ChatAttachment[];
    time: string;
};

type QuestionAttachment = {
    key: string;
    id?: string;
    name: string;
    mediaType: string;
};

const Question = ({ content, image, document, documents, attachments, time }: QuestionProps) => {
    const normalizedAttachments = useMemo<QuestionAttachment[]>(() => {
        if (attachments && attachments.length > 0) {
            return attachments.map((attachment) => ({
                key: attachment.id,
                id: attachment.id,
                name: attachment.name,
                mediaType: attachment.mediaType,
            }));
        }

        const fallbackNames =
            documents && documents.length > 0 ? documents : document ? [document] : [];
        return fallbackNames.map((name, index) => ({
            key: `${name}-${index}`,
            name,
            mediaType: "application/octet-stream",
        }));
    }, [attachments, document, documents]);

    const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});

    useEffect(() => {
        let isCancelled = false;
        const imageAttachments = normalizedAttachments.filter(
            (attachment) =>
                !!attachment.id &&
                attachment.mediaType.startsWith("image/") &&
                !imagePreviews[attachment.id],
        );

        if (imageAttachments.length === 0 || !window.alem) {
            return;
        }

        const loadPreviews = async () => {
            const loaded: Record<string, string> = {};

            for (const attachment of imageAttachments) {
                if (!attachment.id) {
                    continue;
                }

                try {
                    const data = await window.alem.readAttachment(attachment.id);
                    loaded[attachment.id] = `data:${attachment.mediaType};base64,${data}`;
                } catch {
                    // Ignore single preview failures.
                }
            }

            if (!isCancelled && Object.keys(loaded).length > 0) {
                setImagePreviews((current) => ({ ...current, ...loaded }));
            }
        };

        void loadPreviews();

        return () => {
            isCancelled = true;
        };
    }, [imagePreviews, normalizedAttachments]);

    const handleOpenAttachment = (attachment: QuestionAttachment) => {
        if (!attachment.id || !window.alem) {
            return;
        }

        void window.alem.openAttachment(attachment.id);
    };

    return (
        <div className="max-w-[50rem] ml-auto">
            <div className="space-y-4 py-4 px-5 border-3 border-n-2 rounded-[1.25rem] md:p-4 dark:border-transparent dark:bg-n-5/50">
                {normalizedAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                        {normalizedAttachments.map((attachment) => (
                            <Document
                                key={attachment.key}
                                value={attachment.name}
                                mediaType={attachment.mediaType}
                                previewSrc={
                                    attachment.id ? imagePreviews[attachment.id] : undefined
                                }
                                onOpen={
                                    attachment.id
                                        ? () => handleOpenAttachment(attachment)
                                        : undefined
                                }
                            />
                        ))}
                    </div>
                )}
                {content && <div>{content}</div>}
                {image && (
                    <div className="relative w-[11.25rem] h-[11.25rem]">
                        <Image
                            className="rounded-xl object-cover"
                            src={image}
                            fill
                            alt="Avatar"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Question;
