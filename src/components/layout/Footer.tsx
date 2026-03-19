import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Instagram, Facebook } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-foreground text-primary-foreground">
      {/* Newsletter */}
      <div className="border-b border-primary-foreground/10">
        <div className="container mx-auto px-4 py-12 text-center">
          <h3 className="font-display text-2xl lg:text-3xl italic mb-2">
            Receba novidades exclusivas
          </h3>
          <p className="font-body text-sm text-primary-foreground/60 mb-6 max-w-md mx-auto">
            Cadastre-se e seja a primeira a saber sobre lançamentos, promoções e dicas de beleza.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Seu melhor e-mail"
              className="flex-1 bg-primary-foreground/10 border border-primary-foreground/20 rounded-lg px-4 py-3 text-sm font-body text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-body text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Inscrever-se
            </button>
          </form>
        </div>
      </div>

      {/* Links */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div>
            <h4 className="font-display text-xl font-semibold mb-1">Esdra</h4>
            <span className="font-body text-xs text-primary-foreground/50 tracking-[0.2em] uppercase">
              Cosméticos
            </span>
            <p className="font-body text-sm text-primary-foreground/60 mt-4 leading-relaxed">
              A essência do cuidado, traduzida em sofisticação. Produtos selecionados para realçar sua beleza natural.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h5 className="font-body text-sm font-semibold tracking-wide uppercase mb-4">Loja</h5>
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
                  <Link
                    to={item.href}
                    className="font-body text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h5 className="font-body text-sm font-semibold tracking-wide uppercase mb-4">Ajuda</h5>
            <ul className="space-y-2.5">
              {[
                { label: "Meus Pedidos", href: "/conta/pedidos" },
                { label: "Trocas e Devoluções", href: "/suporte" },
                { label: "Perguntas Frequentes", href: "/suporte" },
                { label: "Fale Conosco", href: "/suporte" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    className="font-body text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h5 className="font-body text-sm font-semibold tracking-wide uppercase mb-4">Contato</h5>
            <ul className="space-y-3">
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-primary" />
                <a href="mailto:esdraaline@gmail.com" className="font-body text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                  esdraaline@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-primary" />
                <a href="https://wa.me/5518991459429" className="font-body text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                  (18) 99145-9429
                </a>
              </li>
            </ul>
            <div className="flex gap-3 mt-5">
              <a href="#" className="w-9 h-9 rounded-full border border-primary-foreground/20 flex items-center justify-center hover:bg-primary-foreground/10 transition-colors" aria-label="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full border border-primary-foreground/20 flex items-center justify-center hover:bg-primary-foreground/10 transition-colors" aria-label="Facebook">
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-primary-foreground/10">
        <div className="container mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-body text-xs text-primary-foreground/40">
            © {new Date().getFullYear()} Esdra Cosméticos. Todos os direitos reservados.
          </p>
          <p className="font-body text-xs text-primary-foreground/40">
            CNPJ: 26.744.223/0001-57
          </p>
          <p className="font-body text-xs text-primary-foreground/40">
            Desde 2016 · Valparaíso/SP
          </p>
        </div>
      </div>
    </footer>
  );
}
