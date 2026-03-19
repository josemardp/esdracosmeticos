import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, ShoppingBag, Heart, User, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import logoEsdra from "@/assets/logo-esdra.png";

const navLinks = [
  { label: "Início", href: "/" },
  { label: "Loja", href: "/loja" },
  { label: "Lançamentos", href: "/lancamentos" },
  { label: "Promoções", href: "/promocoes" },
  { label: "Sobre", href: "/sobre" },
  { label: "Suporte", href: "/suporte" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { itemCount } = useCart();

  return (
    <>
      <div className="bg-primary text-primary-foreground text-center text-[11px] sm:text-xs py-2 px-4 font-body tracking-wide">
        ✦ Frete grátis acima de R$ 199 · Parcele em até 3x sem juros · Use <strong>ESDRA10</strong> e ganhe 10% off ✦
      </div>

      <header className="sticky top-0 z-50 bg-background/98 backdrop-blur-md border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 -ml-2 text-foreground" aria-label="Menu">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link to="/" className="flex items-center gap-2">
              <img src={logoEsdra} alt="Esdra Cosméticos" className="h-9 sm:h-10 lg:h-12 w-auto" />
            </Link>

            <nav className="hidden lg:flex items-center gap-7">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`font-body text-sm tracking-wide transition-colors relative py-1 ${
                    location.pathname === link.href
                      ? "text-primary font-medium after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-0.5 sm:gap-1">
              <Button variant="ghost" size="icon" className="text-foreground w-9 h-9 sm:w-10 sm:h-10" aria-label="Buscar"><Search className="w-[18px] h-[18px]" /></Button>
              <Link to="/conta/favoritos">
                <Button variant="ghost" size="icon" className="text-foreground w-9 h-9 sm:w-10 sm:h-10" aria-label="Favoritos"><Heart className="w-[18px] h-[18px]" /></Button>
              </Link>
              <Link to="/carrinho">
                <Button variant="ghost" size="icon" className="relative text-foreground w-9 h-9 sm:w-10 sm:h-10" aria-label="Carrinho">
                  <ShoppingBag className="w-[18px] h-[18px]" />
                  {itemCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 sm:-top-0.5 sm:-right-0.5 bg-primary text-primary-foreground rounded-full w-4 h-4 text-[10px] flex items-center justify-center font-semibold">
                      {itemCount > 9 ? "9+" : itemCount}
                    </span>
                  )}
                </Button>
              </Link>
              <Link to="/conta">
                <Button variant="ghost" size="icon" className="text-foreground w-9 h-9 sm:w-10 sm:h-10" aria-label="Minha Conta"><User className="w-[18px] h-[18px]" /></Button>
              </Link>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden border-t bg-background">
            <nav className="container mx-auto px-4 py-5 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`font-body text-sm py-2.5 px-3 rounded-lg transition-colors ${
                    location.pathname === link.href
                      ? "text-primary font-medium bg-primary/5"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
