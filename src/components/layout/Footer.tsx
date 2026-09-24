import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Instagram, Facebook, ShieldCheck, CreditCard, Truck, Check } from "lucide-react";
import { whatsappUrl } from "@/lib/whatsapp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@") || loading) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("newsletter_subscribers").insert({ email: email.trim(), source: "footer" });
      if (error && error.code === "23505") {
        // duplicate — show success to avoid leaking info
      } else if (error) {
        throw error;
      }
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 4000);
    } catch (err) {
      console.error("Newsletter subscription error:", err);
      toast.error("Não foi possível concluir a inscrição. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-foreground text-background">
      {/* Newsletter */}
      <div className="border-b border-background/10">
        <div className="shell py-10 text-center lg:py-14">
          <h3 className="mb-2 font-display text-[26px] display-md lg:text-[32px]">
            Novidades e promoções no seu e-mail
          </h3>
          <p className="mx-auto mb-6 max-w-md font-body text-[15px] text-background/75">
            Receba os lançamentos e as ofertas da Esdra.
          </p>
          {subscribed ? (
            <div className="flex items-center justify-center gap-2 font-body text-[15px] font-medium text-rose animate-in fade-in slide-in-from-bottom-2 duration-300" role="status">
              <Check className="w-5 h-5" />
              <span>Pronto, seu e-mail está cadastrado.</span>
            </div>
          ) : (
            <form className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row" onSubmit={handleNewsletter}>
              <label htmlFor="newsletter-email" className="sr-only">Seu e-mail</label>
              <input
                id="newsletter-email"
                type="email"
                autoComplete="email"
                placeholder="Seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-12 w-full shrink-0 rounded-full sm:w-auto sm:flex-1 border border-background/35 bg-background/10 px-5 font-body text-base text-background placeholder:text-background/60 focus:border-rose focus:outline-none focus:ring-2 focus:ring-rose/60 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading}
                className="h-12 rounded-full bg-rose px-7 font-body text-[15px] font-medium text-foreground transition-colors hover:bg-background disabled:opacity-50"
              >
                {loading ? "Enviando..." : "Cadastrar e-mail"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Trust badges */}
      <div className="border-b border-background/10">
        <div className="shell py-5">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-background/75">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span className="font-body text-[13px]">Compra Segura</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span className="font-body text-[13px]">Até 3x sem juros</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4" />
              <span className="font-body text-[13px]">Frete grátis acima de R$ 199</span>
            </div>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="shell py-10 lg:py-14">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <h4 className="font-display text-[26px] display-md leading-none">Esdra Cosméticos</h4>
            <p className="mt-4 max-w-xs font-body text-[15px] leading-relaxed text-background/75">
              Perfumaria e beleza em Valparaíso/SP desde 2016, com atendimento pelo WhatsApp.
            </p>
            <Link to="/sobre" className="mt-2 inline-flex min-h-11 items-center font-body text-[15px] text-rose underline underline-offset-4">Conheça a história da Esdra</Link>
          </div>

          {/* Shop */}
          <div>
            <h5 className="mb-3 font-body text-[15px] font-medium text-background">Loja</h5>
            <ul>
              {[
                { label: "Perfumaria", href: "/loja?categoria=perfumes" },
                { label: "Maquiagem", href: "/loja?categoria=maquiagem" },
                { label: "Corpo e Banho", href: "/loja?categoria=corpo-e-banho" },
                { label: "Cabelos", href: "/loja?categoria=cabelos" },
                { label: "Infantil", href: "/loja?categoria=infantil" },
                { label: "Lançamentos", href: "/lancamentos" },
                { label: "Promoções", href: "/promocoes" },
              ].map((item) => (
                <li key={item.label}>
                  <Link to={item.href} className="flex min-h-10 items-center font-body text-[15px] text-background/75 transition-colors hover:text-background">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h5 className="mb-3 font-body text-[15px] font-medium text-background">Ajuda</h5>
            <ul>
              {[
                { label: "Meus Pedidos", href: "/conta/pedidos" },
                { label: "Trocas e Devoluções", href: "/trocas-e-devolucoes" },
                { label: "Perguntas Frequentes", href: "/suporte" },
                { label: "Fale Conosco", href: "/suporte" },
                { label: "Política de Privacidade", href: "/politica-de-privacidade" },
                { label: "Termos de Uso", href: "/termos-de-uso" },
              ].map((item) => (
                <li key={item.label}>
                  <Link to={item.href} className="flex min-h-10 items-center font-body text-[15px] text-background/75 transition-colors hover:text-background">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-2 sm:col-span-1">
            <h5 className="mb-3 font-body text-[15px] font-medium text-background">Contato</h5>
            <ul className="space-y-3">
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-rose" />
                <a href="mailto:lojadares@gmail.com" className="flex min-h-10 items-center font-body text-[15px] text-background/75 transition-colors hover:text-background">
                  lojadares@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-rose" />
                <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="flex min-h-10 items-center font-body text-[15px] text-background/75 transition-colors hover:text-background">
                  (18) 99145-9429
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-3 h-4 w-4 shrink-0 text-rose" />
                <a href="https://share.google/bTJn8G6Fxi4NYL04U" target="_blank" rel="noopener noreferrer" className="flex min-h-10 items-center font-body text-[15px] text-background/75 transition-colors hover:text-background">
                  R. Antônio Cyrillo, 47, Valparaíso/SP
                </a>
              </li>
            </ul>
            <div className="flex gap-3 mt-5">
              <a href="https://www.instagram.com/esdra_aline/" target="_blank" rel="noopener noreferrer" className="flex h-11 w-11 items-center justify-center rounded-full border border-background/30 transition-colors hover:border-background/60 hover:bg-background/10" aria-label="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://www.facebook.com/esdraaline" target="_blank" rel="noopener noreferrer" className="flex h-11 w-11 items-center justify-center rounded-full border border-background/30 transition-colors hover:border-background/60 hover:bg-background/10" aria-label="Facebook">
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-background/10">
        <div className="shell flex flex-col items-center justify-between gap-2 py-5 text-center sm:flex-row sm:text-left">
          <p className="font-body text-[13px] text-background/65">
            © {new Date().getFullYear()} Esdra Cosméticos. Todos os direitos reservados.
          </p>
          <p className="font-body text-[13px] text-background/65">
            CNPJ 26.744.223/0001-57, Valparaíso/SP
          </p>
        </div>
      </div>
    </footer>
  );
}
