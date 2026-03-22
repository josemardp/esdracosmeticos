import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import App from "./App.tsx";
import "./index.css";
import "./pwa-register";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
