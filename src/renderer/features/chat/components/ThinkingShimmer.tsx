import { cn } from "@/lib/utils";

type ThinkingShimmerProps = {
  text?: string;
  className?: string;
};

const defaultText = "Thinking...";

export function ThinkingShimmer({ text = defaultText, className }: ThinkingShimmerProps) {
  const duration = text.length * 0.1;
  return (
    <div className={cn("flex", className)}>
      {text.split("").map((char, index) => (
        <span
          key={index}
          className="text-n-4 dark:text-n-3/80"
          style={{
            animation: `loaderDots ${duration}s ${index * 0.1}s infinite alternate`,
          }}
        >
          {char}
        </span>
      ))}
    </div>
  );
}
