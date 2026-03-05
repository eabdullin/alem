import { Icon } from "@/utils/icons";

type NotifyProps = {
    className?: string;
    iconCheck?: boolean;
    iconDelete?: boolean;
    children: React.ReactNode;
};

const Notify = ({
    className,
    iconCheck,
    iconDelete,
    children,
}: NotifyProps) => (
    <>
        {iconCheck && (
            <div className="flex justify-center items-center shrink-0 w-10 h-10 rounded-full bg-primary-2">
                <Icon className="stroke-n-7" name="check-thin" />
            </div>
        )}
        {iconDelete && (
            <div className="flex justify-center items-center shrink-0 w-10 h-10 rounded-full bg-accent-1">
                <Icon className="stroke-n-1" name="trash" />
            </div>
        )}
        {children}
    </>
);

export default Notify;
