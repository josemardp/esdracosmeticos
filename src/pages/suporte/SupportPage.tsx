import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Mail, MessageCircle, ChevronDown, CheckCircle2 } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import { WHATSAPP_PHONE, whatsappUrl } from "@/lib/whatsapp";

// Respostas conferidas pelo Josemar em 24/09/2026 (entrega, troca em 7 dias, pagamentos do checkout).
const faqs = [
  { q: "Vocês entregam em todo o Brasil?", a: "Sim. Enviamos rápido para todo o Brasil." },
  { q: "Posso trocar um produto?", a: "Sim. Você tem até 7 dias depois de receber o pedido para pedir a troca de produtos sem uso, na embalagem original." },
  { q: "Como acompanho meu pedido?", a: "Entre em Minha conta e abra Meus pedidos para ver como está o seu pedido." },
  { q: "Vocês oferecem frete grátis?", a: "Sim, nas compras acima de R$ 199." },
  { q: "Quais formas de pagamento aceitam?", a: "PIX, cartão de crédito em até 3x sem juros e boleto bancário." },
];

const field = "h-12 rounded-full px-4 text-base";
const label = "mb-1.5 block text-[15px] font-medium text-foreground";
const outlineBtn = "inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 text-[15px] font-medium text-foreground shadow-[inset_0_0_0_1.5px_hsl(var(--foreground))]";

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
  const [openFaq, setOpenFaq] = useState<number | null>(0);

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

  const resetForm = () => { setSent(false); setName(""); setEmail(""); setPhone(""); setSubject(""); setMessage(""); setHoneypot(""); };

  return (
    <div className="font-body">
      <section className="bg-rose">
        <div className="shell py-12 lg:py-16">
          <h1 className="rise-in font-display text-[40px] leading-[1.05] text-foreground display-lg lg:text-[56px]">Como podemos ajudar?</h1>
          <p className="mt-4 max-w-[52ch] text-[17px] leading-relaxed text-foreground">
            O jeito mais rápido é o WhatsApp. Se preferir, mande um e-mail ou use o formulário mais abaixo.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a
              href={whatsappUrl("Olá, preciso de suporte sobre meu pedido da Esdra Cosméticos.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-primary-deep"
            >
              <MessageCircle className="h-[18px] w-[18px]" aria-hidden /> WhatsApp (18) 99145-9429
            </a>
            <a href="mailto:lojadares@gmail.com" className={outlineBtn}>
              <Mail className="h-[18px] w-[18px]" aria-hidden /> lojadares@gmail.com
            </a>
          </div>
          <p className="mt-5 text-[15px] text-foreground">
            Prefere ligar? <a href={`tel:+${WHATSAPP_PHONE}`} className="inline-block py-2 font-medium underline underline-offset-4">(18) 99145-9429</a>
          </p>
        </div>
      </section>

      <div className="shell grid gap-12 py-12 lg:grid-cols-2 lg:gap-16 lg:py-16">
        <section>
          <h2 className="mb-6 font-display text-[30px] leading-tight text-foreground display-md lg:text-[36px]">Perguntas frequentes</h2>
          <div className="border-t">
            {faqs.map((faq, i) => {
              const open = openFaq === i;
              return (
                <div key={faq.q} className="border-b">
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    aria-expanded={open}
                    aria-controls={`suporte-faq-${i}`}
                    className="flex min-h-14 w-full items-center justify-between gap-4 py-3 text-left text-base font-medium text-foreground"
                  >
                    {faq.q}
                    <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 ${open ? "rotate-180" : ""}`} aria-hidden />
                  </button>
                  {open && <p id={`suporte-faq-${i}`} className="pb-5 text-[15px] leading-relaxed text-muted-foreground">{faq.a}</p>}
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="mb-2 font-display text-[30px] leading-tight text-foreground display-md lg:text-[36px]">Envie uma mensagem</h2>
          <p className="mb-6 text-[15px] text-muted-foreground">Respondemos por e-mail ou WhatsApp.</p>
          {sent ? (
            <div className="rounded-2xl bg-secondary px-6 py-8 text-center">
              <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-primary" aria-hidden />
              <h3 className="mb-2 font-display text-2xl text-foreground display-md">Mensagem enviada</h3>
              <p className="mb-6 text-[15px] text-muted-foreground">Recebemos sua mensagem e responderemos em até 24 horas.</p>
              <button onClick={resetForm} className={outlineBtn}>Enviar outra mensagem</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="relative space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="sup-nome" className={label}>Nome</Label>
                  <Input id="sup-nome" className={field} value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" placeholder="Seu nome" />
                </div>
                <div>
                  <Label htmlFor="sup-email" className={label}>E-mail</Label>
                  <Input id="sup-email" className={field} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="seu@email.com" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="sup-tel" className={label}>Telefone <span className="font-normal text-muted-foreground">(opcional)</span></Label>
                  <Input id="sup-tel" className={field} type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="(18) 99999-9999" />
                </div>
                <div>
                  <Label htmlFor="sup-assunto" className={label}>Assunto</Label>
                  <Input id="sup-assunto" className={field} value={subject} onChange={(e) => setSubject(e.target.value)} required placeholder="Dúvida sobre pedido" />
                </div>
              </div>
              {/* Honeypot: invisível para pessoas, pega robôs */}
              <div className="absolute h-0 overflow-hidden opacity-0" aria-hidden="true" tabIndex={-1}>
                <label htmlFor="hp_website">Website</label>
                <input id="hp_website" name="website" type="text" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} autoComplete="off" tabIndex={-1} />
              </div>
              <div>
                <Label htmlFor="sup-msg" className={label}>Mensagem</Label>
                <Textarea id="sup-msg" className="rounded-2xl px-4 py-3 text-base" value={message} onChange={(e) => setMessage(e.target.value)} required rows={5} placeholder="Conte sua dúvida ou o que precisa" />
              </div>
              <button type="submit" disabled={sending} className="inline-flex h-12 w-full items-center justify-center rounded-full bg-primary px-7 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-primary-deep disabled:opacity-60">
                {sending ? "Enviando..." : "Enviar mensagem"}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
