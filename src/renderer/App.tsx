import { useEffect, useState, createContext } from "react";
import LoaderScreen from "@/components/LoaderScreen";
import { AppRoutes } from "./app/routes";

interface AlemContextType {
  settings: any;
  updateSettings: (settings: any) => Promise<void>;
}

export const AlemContext = createContext<AlemContextType>({
  settings: {},
  updateSettings: async () => {},
});

const LOADER_MIN_MS = 1500;

function App() {
  const [settings, setSettings] = useState<any>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const started = Date.now();
    async function init() {
      const { bootstrapDb } = await import("./db/bootstrap");
      await bootstrapDb();
      if (window.alem) {
        const s = await window.alem.getSettings();
        setSettings(s);
      }
      const elapsed = Date.now() - started;
      const remaining = Math.max(0, LOADER_MIN_MS - elapsed);
      setTimeout(() => setReady(true), remaining);
    }
    init();
  }, []);

  const updateSettings = async (newSettings: any) => {
    setSettings(newSettings);
    if (window.alem) {
      await window.alem.saveSettings(newSettings);
    }
  };

  if (!ready) {
    return <LoaderScreen />;
  }

  return (
    <AlemContext.Provider value={{ settings, updateSettings }}>
      <AppRoutes />
    </AlemContext.Provider>
  );
}

export default App;
