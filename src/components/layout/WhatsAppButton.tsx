import { MessageCircle } from "lucide-react";
import { trackWhatsAppClick } from "@/lib/analytics";

interface WhatsAppButtonProps {
  message?: string;
}

export function WhatsAppButton({ 
  message = "Olá, quero tirar uma dúvida sobre um produto da Esdra Cosméticos." 
}: WhatsAppButtonProps) {
  const phone = "5518991459429";
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={url}
      onClick={() => trackWhatsAppClick("floating_button")}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-success hover:brightness-90 text-success-foreground rounded-full w-14 h-14 flex items-center justify-center shadow-elegant-xl transition-all duration-300 hover:-translate-y-1 active:scale-95"
      aria-label="Fale conosco no WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
    </a>
  );
}
