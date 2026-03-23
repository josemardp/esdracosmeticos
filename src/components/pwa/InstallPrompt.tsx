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
    // Already standalone — never show
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // Already dismissed this session
    if (sessionStorage.getItem(dismissKey)) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [dismissKey]);

  const dismiss = useCallback(() => {
    sessionStorage.setItem(dismissKey, "1");
    setVisible(false);
    setDeferredPrompt(null);
  }, [dismissKey]);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      dismiss();
    }
  }, [deferredPrompt, dismiss]);

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
