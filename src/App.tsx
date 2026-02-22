import { Routes, Route } from "react-router-dom";
import { useEffect, useState, createContext } from "react";
import LoaderScreen from "@/components/LoaderScreen";
import HomePage from "@/pages/HomePage";
import ChatPage from "@/pages/ChatPage";
import UpdatesAndFaqPage from "@/pages/UpdatesAndFaqPage";
import PhotoEditingPage from "@/templates/PhotoEditingPage";
import VideoGenerationPage from "@/templates/VideoGenerationPage";
import EducationFeedbackPage from "@/templates/EducationFeedbackPage";
import CodeGenerationPage from "@/templates/CodeGenerationPage";
import AudioGenerationPage from "@/templates/AudioGenerationPage";

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
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/chat/:chatId" element={<ChatPage />} />
        <Route path="/photo-editing" element={<PhotoEditingPage />} />
        <Route path="/video-generation" element={<VideoGenerationPage />} />
        <Route
          path="/education-feedback"
          element={<EducationFeedbackPage />}
        />
        <Route path="/code-generation" element={<CodeGenerationPage />} />
        <Route path="/audio-generation" element={<AudioGenerationPage />} />
        <Route path="/updates-and-faq" element={<UpdatesAndFaqPage />} />
      </Routes>
    </AlemContext.Provider>
  );
}

export default App;
