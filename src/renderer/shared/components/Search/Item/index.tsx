import { Link } from "react-router-dom";
import type { ChatMessageSearchResult } from "@/services/chat-search-service";

type ItemProps = {
    item: ChatMessageSearchResult;
};

const Item = ({ item }: ItemProps) => (
    <Link
        className="group relative flex items-center pl-5 py-4 pr-24 rounded-xl transition-colors hover:bg-n-3/50 md:!bg-transparent md:py-0 md:pl-0 md:pr-18 md:mb-6 md:last:mb-0 dark:hover:bg-n-6 dark:md:hover:bg-transparent"
        to={item.url}
    >
        <div className="w-full">
            <div className="mb-1 truncate base1 font-semibold">{item.title}</div>
            <div className="caption1 text-n-4/75 overflow-hidden text-ellipsis whitespace-nowrap">
                {item.content}
            </div>
        </div>
        <div className="absolute top-1/2 right-5 -translate-y-1/2 caption1 text-n-4/50 group-hover:hidden md:right-0">
            {item.time}
        </div>
        <div className="absolute top-1/2 right-5 -translate-y-1/2 px-2 rounded bg-n-1 caption1 font-semibold text-n-4 hidden group-hover:block md:right-0 dark:bg-n-5 dark:text-n-3">
            Jump
        </div>
    </Link>
);

export default Item;
