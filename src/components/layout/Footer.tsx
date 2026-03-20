import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Instagram, Facebook, ShieldCheck, CreditCard, Truck, Check } from "lucide-react";

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) return;
    setSubscribed(true);
    setEmail("");
    setTimeout(() => setSubscribed(false), 4000);
  };

  return (
    <footer className="bg-foreground text-primary-foreground">
      {/* Newsletter */}
      <div className="border-b border-primary-foreground/10">
        <div className="container mx-auto px-4 py-10 lg:py-12 text-center">
          <h3 className="font-display text-xl sm:text-2xl lg:text-3xl italic mb-2">
            Receba novidades exclusivas
          </h3>
          <p className="font-body text-xs sm:text-sm text-primary-foreground/60 mb-6 max-w-md mx-auto">
            Cadastre-se e seja a primeira a saber sobre lançamentos, promoções e dicas de beleza.
          </p>
          {subscribed ? (
            <div className="flex items-center justify-center gap-2 text-primary font-body text-sm font-medium animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Check className="w-5 h-5" />
              <span>Inscrito com sucesso! Obrigado por se inscrever.</span>
            </div>
          ) : (
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={handleNewsletter}>
              <input
                type="email"
                placeholder="Seu melhor e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 bg-primary-foreground/10 border border-primary-foreground/20 rounded-lg px-4 py-3 text-sm font-body text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-body text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Inscrever-se
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Trust badges */}
      <div className="border-b border-primary-foreground/10">
        <div className="container mx-auto px-4 py-5">
          <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-10 text-primary-foreground/50">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span className="font-body text-xs">Compra Segura</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span className="font-body text-xs">Até 3x sem juros</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4" />
              <span className="font-body text-xs">Frete grátis acima de R$ 199</span>
            </div>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="container mx-auto px-4 py-10 lg:py-12">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <h4 className="font-display text-xl font-semibold mb-1">Esdra</h4>
            <span className="font-body text-[10px] text-primary-foreground/50 tracking-[0.2em] uppercase">
              Cosméticos
            </span>
            <p className="font-body text-xs sm:text-sm text-primary-foreground/60 mt-4 leading-relaxed">
              Desde 2016, selecionamos produtos premium para realçar sua beleza natural com sofisticação e cuidado.
            </p>
            <Link to="/sobre" className="font-body text-xs text-primary hover:underline mt-3 inline-block">Conheça nossa história →</Link>
          </div>

          {/* Shop */}
          <div>
            <h5 className="font-body text-xs font-semibold tracking-widest uppercase mb-4 text-primary-foreground/80">Loja</h5>
            <ul className="space-y-2.5">
              {[
                { label: "Maquiagem", href: "/loja?categoria=maquiagem" },
                { label: "Skincare", href: "/loja?categoria=skincare" },
                { label: "Cabelos", href: "/loja?categoria=cabelos" },
                { label: "Perfumaria", href: "/loja?categoria=perfumaria" },
                { label: "Lançamentos", href: "/lancamentos" },
                { label: "Promoções", href: "/promocoes" },
              ].map((item) => (
                <li key={item.label}>
                  <Link to={item.href} className="font-body text-xs sm:text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h5 className="font-body text-xs font-semibold tracking-widest uppercase mb-4 text-primary-foreground/80">Ajuda</h5>
            <ul className="space-y-2.5">
              {[
                { label: "Meus Pedidos", href: "/conta/pedidos" },
                { label: "Trocas e Devoluções", href: "/trocas-e-devolucoes" },
                { label: "Perguntas Frequentes", href: "/suporte" },
                { label: "Fale Conosco", href: "/suporte" },
                { label: "Política de Privacidade", href: "/politica-de-privacidade" },
                { label: "Termos de Uso", href: "/termos-de-uso" },
              ].map((item) => (
                <li key={item.label}>
                  <Link to={item.href} className="font-body text-xs sm:text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-2 sm:col-span-1">
            <h5 className="font-body text-xs font-semibold tracking-widest uppercase mb-4 text-primary-foreground/80">Contato</h5>
            <ul className="space-y-3">
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <a href="mailto:esdraaline@gmail.com" className="font-body text-xs sm:text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                  esdraaline@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <a href="https://wa.me/5518991459429" className="font-body text-xs sm:text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                  (18) 99145-9429
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="font-body text-xs text-primary-foreground/50">Valparaíso/SP</span>
              </li>
            </ul>
            <div className="flex gap-3 mt-5">
              <a href="#" className="w-9 h-9 rounded-full border border-primary-foreground/20 flex items-center justify-center hover:bg-primary-foreground/10 hover:border-primary-foreground/40 transition-all" aria-label="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full border border-primary-foreground/20 flex items-center justify-center hover:bg-primary-foreground/10 hover:border-primary-foreground/40 transition-all" aria-label="Facebook">
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-primary-foreground/10">
        <div className="container mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <p className="font-body text-[10px] sm:text-xs text-primary-foreground/40">
            © {new Date().getFullYear()} Esdra Cosméticos. Todos os direitos reservados.
          </p>
          <p className="font-body text-[10px] sm:text-xs text-primary-foreground/40">
            CNPJ: 26.744.223/0001-57 · Desde 2016 · Valparaíso/SP
          </p>
        </div>
      </div>
    </footer>
  );
}
