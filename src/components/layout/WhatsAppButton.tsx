import { useState } from "react";
import { MessageCircle, X, ShoppingBag, HelpCircle, Package, Sparkles } from "lucide-react";
import { trackWhatsAppClick } from "@/lib/analytics";
import { useLocation } from "react-router-dom";

const PHONE = "5518991459429";

const quickMessages = [
  { icon: ShoppingBag, label: "Quero comprar", msg: "Olá! Quero fazer um pedido na Esdra Cosméticos. Pode me ajudar?", context: "buy" },
  { icon: HelpCircle, label: "Tirar dúvida", msg: "Olá, tenho uma dúvida sobre um produto da Esdra Cosméticos.", context: "question" },
  { icon: Package, label: "Meu pedido", msg: "Olá, quero saber sobre o status do meu pedido na Esdra Cosméticos.", context: "order" },
  { icon: Sparkles, label: "Indicação", msg: "Olá! Preciso de uma indicação de produto. Pode me ajudar a escolher?", context: "recommendation" },
];

export function WhatsAppButton() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const getContextualDefault = () => {
    if (location.pathname.startsWith("/produto/")) {
      return "Olá, quero tirar uma dúvida sobre um produto da Esdra Cosméticos.";
    }
    if (location.pathname === "/carrinho" || location.pathname === "/checkout") {
      return "Olá, estou finalizando meu pedido e preciso de ajuda.";
    }
    return "Olá! Gostaria de falar com a Esdra Cosméticos.";
  };

  const handleClick = (msg: string, context: string) => {
    trackWhatsAppClick(context);
    window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`, "_blank");
    setOpen(false);
  };

  return (
    <>
      {/* Quick menu */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="bg-card border rounded-xl shadow-elegant-xl p-3 w-56 space-y-1">
            <p className="font-body text-xs font-semibold text-foreground px-2 pb-1 border-b mb-1">Como podemos ajudar?</p>
            {quickMessages.map(q => (
              <button
                key={q.context}
                onClick={() => handleClick(q.msg, q.context)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-secondary transition-colors text-left"
              >
                <q.icon className="w-4 h-4 text-primary shrink-0" />
                <span className="font-body text-sm text-foreground">{q.label}</span>
              </button>
            ))}
            <div className="border-t pt-1 mt-1">
              <button
                onClick={() => handleClick(getContextualDefault(), "floating_generic")}
                className="w-full font-body text-xs text-muted-foreground hover:text-primary px-2.5 py-1.5 transition-colors text-left"
              >
                Mensagem livre →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 bg-success hover:brightness-90 text-success-foreground rounded-full w-14 h-14 flex items-center justify-center shadow-elegant-xl transition-all duration-300 hover:-translate-y-1 active:scale-95"
        aria-label="Fale conosco no WhatsApp"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </>
  );
}
