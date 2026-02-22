import { useEffect, useState } from "react";

const SLOGANS = [
  "One workspace. Every model.",
  "AI without lock-in.",
  "Choose your model. Own your data.",
  "The AI workspace that works for you.",
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
        src="/logo-loader.png"
        alt="Alem"
        className="h-32 w-auto object-contain md:h-36"
        width={256}
        height={256}
      />
      <div className="min-h-[2rem] px-6 text-center">
        <p
          key={index}
          className="font-inter text-base font-medium tracking-tight text-n-4 animate-in fade-in duration-300"
        >
          {SLOGANS[index]}
        </p>
      </div>
    </div>
  );
}
