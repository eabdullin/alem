import { Icon } from "@/utils/icons";
import Loading from "./Loading";
import Actions from "./Actions";

type AnswerProps = {
    children?: React.ReactNode;
    loading?: boolean;
    showThinkingMessages?: boolean;
    time?: string;
};

const Answer = ({ children, loading, showThinkingMessages, time }: AnswerProps) => {
    return (
        <div className="max-w-[50rem]">
            <div className="py-4 px-5 space-y-4 bg-n-2 rounded-[1.25rem] md:p-4 dark:bg-n-7">
                {loading ? <Loading showThinkingMessages={showThinkingMessages} /> : children}
            </div>
            {loading ? (
                <div className="mt-2 pl-5">
                    <button className="group flex items-center px-2 py-0.5 bg-n-3 rounded-md caption1 txt-n-6 transition-colors hover:text-primary-1 dark:bg-n-7 dark:text-n-3 dark:hover:text-primary-1">
                        <Icon
                            className="size-4 mr-2 transition-colors group-hover:stroke-primary-1 dark:stroke-n-3"
                            name="pause-circle"
                        />
                        Pause generating
                    </button>
                </div>
            ) : (
                <div className="mt-2 px-5 flex items-center justify-end">
                    <Actions />
                </div>
            )}
        </div>
    );
};

export default Answer;
