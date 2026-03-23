import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import App from "./App.tsx";
import "./index.css";
import "./pwa-register";

declare global {
  interface Window {
    __esdraDeferredInstallPrompt?: Event;
  }
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  window.__esdraDeferredInstallPrompt = event;
});

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
