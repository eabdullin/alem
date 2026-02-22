import { useEffect, useState } from "react";

type LoadingProps = {
  showThinkingMessages?: boolean;
};

const THINKING_MESSAGES = [
  "Thinking...",
  "Thinking about your request...",
  "Finding the best answer...",
  "Checking the details...",
  "Putting together a clear response...",
];

const MESSAGE_ROTATE_MS = 4500;

const Loading = ({ showThinkingMessages = false }: LoadingProps) => {
  const [messageIndex, setMessageIndex] = useState(() =>
    Math.floor(Math.random() * THINKING_MESSAGES.length),
  );

  useEffect(() => {
    if (!showThinkingMessages || THINKING_MESSAGES.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setMessageIndex((previous) => {
        let next = previous;
        while (next === previous) {
          next = Math.floor(Math.random() * THINKING_MESSAGES.length);
        }
        return next;
      });
    }, MESSAGE_ROTATE_MS);

    return () => window.clearInterval(intervalId);
  }, [showThinkingMessages]);

  return (
    <div className="space-y-2">
      <div className="flex space-x-1.5">
        <div className="w-2 h-2 rounded-full bg-n-7 animate-[loaderDots_0.6s_0s_infinite_alternate] dark:bg-n-1"></div>
        <div className="w-2 h-2 rounded-full bg-n-7 animate-[loaderDots_0.6s_0.3s_infinite_alternate] dark:bg-n-1"></div>
        <div className="w-2 h-2 rounded-full bg-n-7 animate-[loaderDots_0.6s_0.6s_infinite_alternate] dark:bg-n-1"></div>
      </div>
      {showThinkingMessages && (
        <div className="caption1 text-n-4 dark:text-n-3/80">
          {THINKING_MESSAGES[messageIndex]}
        </div>
      )}
    </div>
  );
};

export default Loading;
