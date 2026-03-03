import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoaderScreen from "@/components/LoaderScreen";
import { OnboardingPage } from "@/features/onboarding";
import { AppRoutes } from "./app/routes";
import { useAppStore } from "@/stores/useAppStore";

/** Syncs theme from settings to document for shadcn/Tailwind dark mode */
function ThemeSync() {
  const theme = useAppStore((s) => s.settings.theme) ?? "dark";

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    if (theme === "dark") {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    } else {
      root.setAttribute("data-theme", "light");
    }
  }, [theme]);

  return null;
}

const LOADER_MIN_MS = 1500;

function App() {
  const navigate = useNavigate();
  const { settings, isReady, initialize, updateSettings } = useAppStore();
  const [showLoader, setShowLoader] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const started = Date.now();
    initialize().then(() => {
      const s = useAppStore.getState().settings;
      setShowOnboarding(!s?.hasSeenOnboarding);
      const elapsed = Date.now() - started;
      const remaining = Math.max(0, LOADER_MIN_MS - elapsed);
      setTimeout(() => setShowLoader(false), remaining);
    });
  }, []);

  const completeOnboarding = async (options?: { openSettings?: boolean }) => {
    await updateSettings({ ...settings, hasSeenOnboarding: true });
    setShowOnboarding(false);
    if (options?.openSettings) {
      navigate("/settings");
    }
  };

  if (!isReady || showLoader) {
    return <LoaderScreen />;
  }

  return (
    <>
      <ThemeSync />
      {showOnboarding ? (
        <OnboardingPage onComplete={completeOnboarding} />
      ) : (
        <AppRoutes />
      )}
    </>
  );
}

export default App;
