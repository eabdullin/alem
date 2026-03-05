import "./logger"; // Initialize renderer logging early (catches unhandled errors)
import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { AppShell } from "./providers";
import "./globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <AppShell>
        <App />
      </AppShell>
    </HashRouter>
  </React.StrictMode>
);
