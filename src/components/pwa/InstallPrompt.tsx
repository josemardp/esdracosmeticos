import { useState, useEffect, useCallback } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallPromptProps {
  /** sessionStorage key to track dismissal */
  dismissKey: "pwa-install-dismissed-store" | "pwa-install-dismissed-admin";
  /** Label shown on the install button */
  label?: string;
}

export function InstallPrompt({
  dismissKey,
  label = "Instalar App",
}: InstallPromptProps) {
  const isMobile = useIsMobile();
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  // Listen for beforeinstallprompt
  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (isStandalone) {
      console.log(`[PWA][${dismissKey}] standalone — skipping`);
      return;
    }
    if (sessionStorage.getItem(dismissKey)) {
      console.log(`[PWA][${dismissKey}] dismissed-session`);
      return;
    }

    const existingPrompt = window.__esdraDeferredInstallPrompt;
    if (existingPrompt) {
      console.log(`[PWA][${dismissKey}] eligible`);
      setDeferredPrompt(existingPrompt as BeforeInstallPromptEvent);
      setVisible(true);
      console.log(`[PWA][${dismissKey}] visible`);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      window.__esdraDeferredInstallPrompt = e;
      console.log(`[PWA][${dismissKey}] eligible`);
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
      console.log(`[PWA][${dismissKey}] visible`);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [dismissKey]);

  const hidePrompt = useCallback(() => {
    setVisible(false);
    setDeferredPrompt(null);
    window.__esdraDeferredInstallPrompt = undefined;
  }, []);

  const dismiss = useCallback(() => {
    console.log(`[PWA][${dismissKey}] dismissed-session`);
    sessionStorage.setItem(dismissKey, "1");
    hidePrompt();
  }, [dismissKey, hidePrompt]);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      console.log(`[PWA][${dismissKey}] accepted`);
      hidePrompt();
    } else {
      console.log(`[PWA][${dismissKey}] declined`);
      dismiss();
    }
  }, [deferredPrompt, hidePrompt, dismiss, dismissKey]);

  // Hide on native install (e.g. via browser menu)
  useEffect(() => {
    const onInstalled = () => {
      console.log(`[PWA][${dismissKey}] appinstalled`);
      hidePrompt();
    };
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, [hidePrompt, dismissKey]);

  // Hide on desktop, if dismissed, or if no prompt available
  if (!isMobile || !visible || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-card border rounded-xl shadow-lg p-3 flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Download className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-body text-sm font-medium text-foreground truncate">
            {label}
          </p>
          <p className="font-body text-xs text-muted-foreground">
            Acesso rápido pelo celular
          </p>
        </div>
        <Button size="sm" onClick={install} className="flex-shrink-0 text-xs h-8 px-3">
          Instalar
        </Button>
        <button
          onClick={dismiss}
          className="flex-shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
