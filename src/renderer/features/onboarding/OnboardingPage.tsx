import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import ProviderLogo from "@/components/ProviderLogos";
import { PROVIDERS } from "@/constants/providers";
import {
  KeyRound,
  MessageSquareText,
  Paperclip,
  ShieldCheck,
  Crosshair,
  Lock,
  type LucideIcon,
} from "lucide-react";

type OnboardingPageProps = {
  onComplete: (options?: { openSettings?: boolean }) => Promise<void> | void;
};

type Feature = {
  icon: LucideIcon;
  text: string;
};

type Slide = {
  title: string;
  subtitle: string;
  features: Feature[];
  image: string;
  imageAlt: string;
};

const slides: Slide[] = [
  {
    title: "Your AI, your rules",
    subtitle:
      "qurt is an AI Coworker and assistant where you pick the provider, the model, and keep your keys.",
    features: [
      { icon: KeyRound, text: "Bring your own API keys — no vendor lock-in" },
      { icon: MessageSquareText, text: "Chat with any supported model in one place" },
      { icon: Paperclip, text: "Attach files and images for richer conversations" },
    ],
    image: "onboarding-1.png",
    imageAlt: "AI Coworker and assistant illustration — replace with a desktop workspace showing provider logos",
  },
  {
    title: "Built for real work",
    subtitle:
      "Agent mode uses tools to help with browser, terminal, and file tasks.",
    features: [
      { icon: ShieldCheck, text: "Review agent plans before they run — you stay in control" },
      { icon: Crosshair, text: "Start with focused prompts for the best results" },
      { icon: Lock, text: "Your data stays local, keys never leave your machine" },
    ],
    image: "onboarding-2.png",
    imageAlt: "Human-AI collaboration — replace with a person reviewing AI suggestions",
  },
  {
    title: "Get started in 30 seconds",
    subtitle: "Add one API key and you're ready to chat.",
    features: [],
    image: "onboarding-3.jpg",
    imageAlt: "API key setup — replace with a settings panel illustration with a key and checkmark",
  },
];

const OnboardingPage = ({ onComplete }: OnboardingPageProps) => {
  const [api, setApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLastSlide = useMemo(
    () => activeIndex === slides.length - 1,
    [activeIndex],
  );

  useEffect(() => {
    if (!api) return;

    const handleSelect = () => setActiveIndex(api.selectedScrollSnap());
    handleSelect();
    api.on("select", handleSelect);
    return () => {
      api.off("select", handleSelect);
    };
  }, [api]);

  const finishOnboarding = useCallback(
    async (options?: { openSettings?: boolean }) => {
      if (isFinishing) return;
      setError(null);
      setIsFinishing(true);
      try {
        await onComplete(options);
      } catch {
        setError("Could not save onboarding status. Please try again.");
        setIsFinishing(false);
      }
    },
    [isFinishing, onComplete],
  );

  const handlePrimary = useCallback(async () => {
    if (isLastSlide) {
      await finishOnboarding({ openSettings: true });
      return;
    }
    api?.scrollNext();
  }, [isLastSlide, finishOnboarding, api]);

  const handleBack = useCallback(() => {
    api?.scrollPrev();
  }, [api]);

  const slide = slides[activeIndex];

  return (
    <div className="min-h-screen min-h-screen-ios bg-n-1 dark:bg-n-6">
      <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6 py-8">
        <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-n-3 bg-n-1 shadow-lg dark:border-n-5 dark:bg-n-7">
          {/* Header */}
          <div className="flex items-center justify-between px-8 pt-6">
            <img
              src="./logo.horiz.png"
              alt="Qurt"
              className="h-10 w-auto shrink-0 object-contain"
            />
            <span className="caption1 text-n-4">
              Step {activeIndex + 1} of {slides.length}
            </span>
          </div>

          {/* Carousel */}
          <Carousel
            setApi={setApi}
            opts={{ watchDrag: false }}
            className="w-full"
          >
            <CarouselContent className="ml-0">
              {slides.map((s, i) => (
                <CarouselItem key={s.title} className="pl-0">
                  <div className="grid grid-cols-2 gap-0 h-full">
                    {/* Illustration */}
                    <div className="min-w-0 flex items-center justify-center">
                      <img
                        src={s.image}
                        alt={s.imageAlt}
                        className="h-auto max-h-64 w-full max-w-sm rounded-2xl object-cover"
                      />
                    </div>

                    {/* Content */}
                    <div
                      key={activeIndex === i ? `active-${i}` : `idle-${i}`}
                      className={`min-w-0 flex flex-col justify-center p-8 lg:p-10 ${
                        activeIndex === i ? "animate-slideIn" : ""
                      }`}
                    >
                      <h1 className="h4 text-n-7 dark:text-n-1">{s.title}</h1>
                      <p className="body2 mt-3 text-n-4 dark:text-n-3">
                        {s.subtitle}
                      </p>

                      {s.features.length > 0 && (
                        <ul className="mt-6 space-y-4">
                          {s.features.map((f) => (
                            <li key={f.text} className="flex items-start gap-3">
                              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-1/10 text-primary-1">
                                <f.icon className="h-4 w-4" />
                              </span>
                              <span className="base1 leading-relaxed text-n-6 dark:text-n-2">
                                {f.text}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Provider cards on last slide */}
                      {i === slides.length - 1 && (
                        <div className="mt-6 space-y-2.5">
                          {PROVIDERS.map((p) => (
                            <div
                              key={p.id}
                              className="flex items-center gap-3 rounded-xl border border-n-3 bg-n-2/50 px-4 py-1 dark:border-n-5 dark:bg-n-6"
                            >
                              <ProviderLogo
                                providerId={p.id}
                                className="h-6 shrink-0"
                              />
                              <span className="caption1 text-n-4">
                                {p.description}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {/* Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-8 pb-6 pt-2">
            {/* Dots */}
            <div className="flex items-center gap-2">
              {slides.map((_, i) => (
                <span
                  key={i}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === activeIndex
                      ? "w-6 bg-primary-1"
                      : "w-2 bg-n-3 dark:bg-n-5"
                  }`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {activeIndex > 0 && (
                <Button variant="ghost" onClick={handleBack} disabled={isFinishing}>
                  Back
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => void finishOnboarding()}
                disabled={isFinishing}
              >
                {isLastSlide ? "I'll do it later" : "Skip"}
              </Button>
              <Button onClick={handlePrimary} disabled={isFinishing}>
                {isLastSlide ? "Set up a provider" : "Next"}
              </Button>
            </div>
          </div>

          {error && (
            <p className="px-8 pb-4 base2 text-accent-1">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
