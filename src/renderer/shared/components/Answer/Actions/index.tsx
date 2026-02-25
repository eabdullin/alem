import { CopyToClipboard } from "react-copy-to-clipboard";
import { toast } from "react-hot-toast";
import { Icon } from "@/utils/icons";
import Notify from "@/components/Notify";

type ActionsProps = {};

const Actions = ({}: ActionsProps) => {
    const onCopy = () => {
        toast((t) => (
            <Notify iconCheck>
                <div className="ml-3 h6">Content copied</div>
            </Notify>
        ));
    };

    const handleBranchChat = () => {
        toast((t) => (
            <Notify iconCheck>
                <div className="ml-3 h6">Chat branched</div>
            </Notify>
        ));
    };

    const iconButtonClass =
        "group flex items-center justify-center w-7 h-7 rounded-md transition-colors";

    return (
        <div className="flex items-center gap-1 px-1.5 py-1 bg-n-3 rounded-lg dark:bg-n-7">
            <CopyToClipboard text="Content" onCopy={onCopy}>
                <button
                    className={`${iconButtonClass} md:hidden`}
                    title="Copy"
                    aria-label="Copy response"
                >
<Icon
                    className="size-4 stroke-n-4 transition-colors group-hover:stroke-primary-1 dark:stroke-n-3"
                    name="copy"
                />
                </button>
            </CopyToClipboard>

            <button
                className={iconButtonClass}
                title="Regenerate response"
                aria-label="Regenerate response"
            >
                <Icon
                    className="size-4 stroke-n-4 transition-colors group-hover:stroke-primary-1 dark:stroke-n-3"
                    name="refresh"
                />
            </button>

            <button
                className={iconButtonClass}
                onClick={handleBranchChat}
                title="Branch chat"
                aria-label="Branch chat"
            >
                <Icon
                    className="size-4 stroke-n-4 transition-colors group-hover:stroke-primary-1 dark:stroke-n-3"
                    name="external-link"
                />
            </button>
        </div>
    );
};

export default Actions;
