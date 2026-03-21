import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Mail, Phone, MessageCircle, Send, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useSEO } from "@/hooks/use-seo";
import { WHATSAPP_PHONE, whatsappUrl } from "@/lib/whatsapp";

const faqs = [
  { q: "Qual o prazo de entrega?", a: "O prazo varia de 3 a 10 dias úteis, dependendo da sua região." },
  { q: "Posso trocar um produto?", a: "Sim! Você tem até 30 dias para solicitar a troca de produtos não utilizados." },
  { q: "Como acompanho meu pedido?", a: "Acesse 'Minha Conta > Meus Pedidos' para ver o status atualizado." },
  { q: "Vocês oferecem frete grátis?", a: "Sim, para compras acima de R$ 199 o frete é gratuito para todo o Brasil." },
  { q: "Quais formas de pagamento aceitam?", a: "PIX, cartão de crédito, boleto e transferência bancária." },
];

export default function SupportPage() {
  useSEO("Suporte e Contato", "Precisa de ajuda? Fale conosco por WhatsApp, e-mail ou envie uma mensagem. Atendimento rápido e personalizado.");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return; // silently block bots
    setSending(true);
    const { error } = await supabase.from("support_tickets").insert({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      subject: subject.trim(),
      message: message.trim(),
      channel: "website",
    });
    setSending(false);
    if (error) {
      toast({ title: "Erro ao enviar", description: "Tente novamente ou entre em contato pelo WhatsApp.", variant: "destructive" });
    } else {
      setSent(true);
      toast({ title: "Mensagem enviada!", description: "Responderemos em até 24 horas." });
    }
  };

  return (
    <div className="py-12 lg:py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-3xl lg:text-5xl italic text-foreground mb-3">
            Como podemos ajudar?
          </h1>
          <p className="font-body text-sm text-muted-foreground max-w-lg mx-auto">
            Estamos aqui para garantir a melhor experiência. Entre em contato por qualquer um dos nossos canais.
          </p>
        </motion.div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-16">
          <a
            href="mailto:esdraaline@gmail.com"
            className="group bg-card border rounded-xl p-6 text-center hover:shadow-elegant transition-all"
          >
            <Mail className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="font-body text-sm font-semibold text-foreground mb-1">E-mail</h3>
            <p className="font-body text-xs text-muted-foreground group-hover:text-primary transition-colors">
              esdraaline@gmail.com
            </p>
          </a>
          <a
            href={whatsappUrl("Olá, preciso de suporte sobre meu pedido da Esdra Cosméticos.")}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-card border rounded-xl p-6 text-center hover:shadow-elegant transition-all"
          >
            <MessageCircle className="w-8 h-8 text-success mx-auto mb-3" />
            <h3 className="font-body text-sm font-semibold text-foreground mb-1">WhatsApp</h3>
            <p className="font-body text-xs text-muted-foreground group-hover:text-success transition-colors">
              (18) 99145-9429
            </p>
          </a>
          <a
            href={`tel:+${WHATSAPP_PHONE}`}
            className="group bg-card border rounded-xl p-6 text-center hover:shadow-elegant transition-all"
          >
            <Phone className="w-8 h-8 text-info mx-auto mb-3" />
            <h3 className="font-body text-sm font-semibold text-foreground mb-1">Telefone</h3>
            <p className="font-body text-xs text-muted-foreground group-hover:text-info transition-colors">
              (18) 99145-9429
            </p>
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="font-display text-2xl text-foreground mb-6 flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              Envie sua mensagem
            </h2>
            {sent ? (
              <div className="bg-success/10 border border-success/20 rounded-xl p-8 text-center">
                <MessageCircle className="w-10 h-10 text-success mx-auto mb-3" />
                <h3 className="font-display text-xl text-foreground mb-2">Mensagem enviada!</h3>
                <p className="font-body text-sm text-muted-foreground mb-4">
                  Recebemos sua mensagem e responderemos em até 24 horas.
                </p>
                <Button variant="outline" onClick={() => { setSent(false); setName(""); setEmail(""); setPhone(""); setSubject(""); setMessage(""); setHoneypot(""); }}>
                  Enviar outra mensagem
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 relative">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-body text-sm">Nome *</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Seu nome" />
                  </div>
                  <div>
                    <Label className="font-body text-sm">E-mail *</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="seu@email.com" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-body text-sm">Telefone</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(18) 99999-9999" />
                  </div>
                  <div>
                    <Label className="font-body text-sm">Assunto *</Label>
                    <Input value={subject} onChange={(e) => setSubject(e.target.value)} required placeholder="Dúvida sobre pedido" />
                  </div>
                </div>
                {/* Honeypot — invisible to real users */}
                <div className="absolute opacity-0 h-0 overflow-hidden" aria-hidden="true" tabIndex={-1}>
                  <label htmlFor="hp_website">Website</label>
                  <input id="hp_website" name="website" type="text" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} autoComplete="off" tabIndex={-1} />
                </div>
                <div>
                  <Label className="font-body text-sm">Mensagem *</Label>
                  <Textarea value={message} onChange={(e) => setMessage(e.target.value)} required rows={5} placeholder="Descreva sua dúvida ou solicitação..." />
                </div>
                <Button type="submit" className="w-full" disabled={sending}>
                  {sending ? "Enviando..." : "Enviar mensagem"}
                </Button>
              </form>
            )}
          </motion.div>

          {/* FAQ */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="font-display text-2xl text-foreground mb-6 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              Perguntas frequentes
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-card border rounded-lg p-4">
                  <h4 className="font-body text-sm font-semibold text-foreground mb-1">{faq.q}</h4>
                  <p className="font-body text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
