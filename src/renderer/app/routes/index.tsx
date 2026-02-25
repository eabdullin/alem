import { Routes, Route } from "react-router-dom";
import { HomePage } from "@/features/home";
import { ChatPage } from "@/features/chat";
import { UpdatesAndFaqPage } from "@/features/updatesFaq";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/chat/:chatId" element={<ChatPage />} />
      <Route path="/updates-and-faq" element={<UpdatesAndFaqPage />} />
    </Routes>
  );
}
