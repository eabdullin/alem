import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@/utils/icons";
import Select from "@/components/Select";
import { CHAT_HISTORY_UPDATED_EVENT } from "@/services/chat-service";
import {
    chatSearchService,
    type ChatMessageSearchResult,
    type SearchDateFilter,
} from "@/services/chat-search-service";
import Item from "./Item";

const dates = [
    {
        id: "all",
        title: "Any time",
    },
    {
        id: "today",
        title: "Today",
    },
    {
        id: "lastWeek",
        title: "Last week",
    },
    {
        id: "last30Days",
        title: "Last 30 days",
    },
].map((date) => ({
    ...date,
    id: date.id as SearchDateFilter,
}));

const Search = () => {
    const [search, setSearch] = useState<string>("");
    const [date, setDate] = useState<(typeof dates)[number]>(dates[0]);
    const [results, setResults] = useState<ChatMessageSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState<boolean>(false);

    const hasQuery = useMemo(() => search.trim().length > 0, [search]);

    const runSearch = useCallback(async () => {
        const query = search.trim();
        if (!query) {
            setResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const items = await chatSearchService.searchMessages({
            query,
            dateFilter: date.id,
        });
        setResults(items);
        setIsSearching(false);
    }, [date.id, search]);

    useEffect(() => {
        void runSearch();
    }, [runSearch]);

    useEffect(() => {
        const handleChatHistoryUpdated = () => {
            void runSearch();
        };

        window.addEventListener(
            CHAT_HISTORY_UPDATED_EVENT,
            handleChatHistoryUpdated
        );

        return () => {
            window.removeEventListener(
                CHAT_HISTORY_UPDATED_EVENT,
                handleChatHistoryUpdated
            );
        };
    }, [runSearch]);

    return (
        <form className="" action="" onSubmit={(event) => event.preventDefault()}>
            <div className="relative border-b border-n-3 dark:border-n-6">
                <button
                    className="group absolute top-7 left-10 outline-none md:hidden"
                    type="submit"
                >
                    <Icon
                        className="size-8 stroke-n-4/50 transition-colors group-hover:stroke-n-7 dark:group-hover:stroke-n-3"
                        name="search"
                    />
                </button>
                <input
                    className="w-full h-22 pl-24 pr-5 bg-transparent border-none outline-none h5 text-n-7 placeholder:text-n-4/50 md:h-18 md:pl-18 dark:text-n-1"
                    type="text"
                    name="search"
                    placeholder="Search"
                    value={search}
                    onChange={(e: any) => setSearch(e.target.value)}
                />
            </div>
            <div className="pt-5 px-10 pb-6 md:px-6">
                <div className="flex mb-5 md:block md:mb-4">
                    <Select
                        className="w-[10.31rem] md:w-full"
                        classButton="h-11 rounded-full shadow-[inset_0_0_0_0.0625rem_#DADBDC] caption1 dark:shadow-[inset_0_0_0_0.0625rem_#2A2E2F] dark:bg-transparent"
                        classOptions="min-w-full"
                        classIcon="w-5 h-5 fill-n-4/50"
                        classArrow="dark:fill-n-4"
                        icon="clock"
                        placeholder="Date"
                        items={dates}
                        value={date}
                        onChange={setDate}
                    />
                </div>
                <div className="caption1 text-n-4/75">
                    {!hasQuery
                        ? "Type to search in chat messages."
                        : isSearching
                        ? "Searching..."
                        : `${results.length} result${results.length === 1 ? "" : "s"}`}
                </div>
                <div className="mt-4">
                    {results.map((item) => (
                        <Item item={item} key={item.id} />
                    ))}
                    {!isSearching && hasQuery && results.length === 0 && (
                        <div className="mt-8 text-center caption1 text-n-4">
                            No messages found.
                        </div>
                    )}
                </div>
            </div>
        </form>
    );
};

export default Search;
