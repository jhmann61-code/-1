// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./lib/ThemeContext";
import App from "./App";
import { SettingsProvider } from "./lib/SettingsContext";
import "./index.css";


// Leaflet css + 아이콘 경로 fix
import "leaflet/dist/leaflet.css";
import { applyLeafletIconFix } from "./lib/leafletIconFix";
applyLeafletIconFix(); // ← 여기! (전역에서 1회 실행)

// React Query 클라이언트
const qc = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={qc}>
        <SettingsProvider>
          <ThemeProvider>
          <App />
          </ThemeProvider>
        </SettingsProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);
