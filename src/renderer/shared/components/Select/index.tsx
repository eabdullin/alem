import * as React from "react";
import { twMerge } from "tailwind-merge";
import { Icon } from "@/utils/icons";
import {
    Select as RadixSelect,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type SelectItemBase = {
    id: string;
    title: string;
    color?: string;
    icon?: string;
};

type SelectProps<T extends SelectItemBase = SelectItemBase> = {
    label?: string;
    title?: string;
    icon?: string;
    className?: string;
    classButton?: string;
    classArrow?: string;
    classOptions?: string;
    classOption?: string;
    classIcon?: string;
    placeholder?: string;
    items: T[];
    value: T | null;
    onChange: (item: T) => void;
    small?: boolean;
    up?: boolean;
    noShadow?: boolean;
};

const Select = <T extends SelectItemBase>({
    label,
    title,
    icon,
    className,
    classButton,
    classOptions,
    classOption,
    classIcon,
    placeholder,
    items,
    value,
    onChange,
    small,
    up,
    noShadow,
}: SelectProps<T>): React.ReactElement => {
    const triggerClass = twMerge(
        small && "h-9 pr-3 rounded-md",
        noShadow && "border border-n-3 dark:border-n-5 shadow-none",
        "[&_[data-select-swatch]]:hidden",
        classButton
    );

    const contentClass = twMerge(
        noShadow && "border border-n-3 dark:border-n-5 shadow-none",
        up && "top-auto bottom-full mt-0 mb-2 data-[side=top]:mb-2",
        small && up && "mb-1",
        classOptions
    );

    return (
        <div className={`relative ${className}`}>
            {label && (
                <div className="flex mb-2 base2 font-semibold">{label}</div>
            )}
            <RadixSelect
                value={value?.id ?? ""}
                onValueChange={(id) => {
                    const item = items.find((i) => i.id === id);
                    if (item) onChange(item);
                }}
            >
                <SelectTrigger className={triggerClass}>
                    {title && (
                        <div className="shrink-0 mr-2 pr-2 border-r border-n-3 text-n-4 dark:border-n-4/50">
                            {title}
                        </div>
                    )}
                    {icon && (
                        <Icon
                            className={twMerge(
                                "shrink-0 mr-2 dark:stroke-n-4",
                                small && "size-5 mr-1.5",
                                classIcon
                            )}
                            name={icon}
                        />
                    )}
                    {value?.color && (
                        <div
                            className="shrink-0 w-3.5 h-3.5 ml-1 mr-4 rounded"
                            style={{ backgroundColor: value.color }}
                        />
                    )}
                    {value?.icon && (
                        <Icon
                            className="size-5 mr-3 dark:stroke-n-1"
                            name={value.icon}
                        />
                    )}
                    <SelectValue
                        className="mr-auto truncate"
                        placeholder={placeholder}
                    />
                </SelectTrigger>
                <SelectContent
                    className={contentClass}
                    position={up ? "popper" : "popper"}
                    side={up ? "top" : "bottom"}
                >
                    {items.map((item) => (
                        <SelectItem
                            key={item.id}
                            value={item.id}
                            className={twMerge(
                                small && "py-1 font-semibold",
                                classOption
                            )}
                        >
                            {item.color && (
                                <div
                                    data-select-swatch
                                    className="shrink-0 w-3.5 h-3.5 mt-[0.3125rem] ml-1 mr-4 rounded"
                                    style={{
                                        backgroundColor: item.color,
                                    }}
                                />
                            )}
                            {item.icon && (
                                <Icon
                                    className="size-5 mt-0.5 mr-3 dark:stroke-n-1"
                                    name={item.icon}
                                />
                            )}
                            {item.title}
                        </SelectItem>
                    ))}
                </SelectContent>
            </RadixSelect>
        </div>
    );
};

export default Select;
