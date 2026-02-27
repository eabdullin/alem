import { useEffect, useState } from "react";

const SLOGANS = [
  "One workspace. Every model.",
  "AI without lock-in.",
  "Choose your model. Own your data.",
  "The AI Coworker and assistant that works for you.",
  "Smarter chats, your way.",
  "Your models. Your keys. Your world.",
];

const ROTATE_INTERVAL_MS = 2800;

export default function LoaderScreen() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % SLOGANS.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 bg-n-7">
      <img
        src="./logo.vert.png"
        alt="Qurt"
        className="h-32 w-auto object-contain md:h-36"
        width={256}
        height={256}
      />
      <div className="min-h-[2rem] px-6 text-center">
        <p
          key={index}
          className="body2 font-medium text-n-2 animate-in fade-in duration-300"
        >
          {SLOGANS[index]}
        </p>
      </div>
    </div>
  );
}
