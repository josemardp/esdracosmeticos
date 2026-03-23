import { Outlet, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { WhatsAppButton } from "./WhatsAppButton";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

export function PublicLayout() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
      {isHome && (
        <InstallPrompt
          dismissKey="pwa-install-dismissed-store"
          label="Instalar Esdra Cosméticos"
        />
      )}
    </div>
  );
}
