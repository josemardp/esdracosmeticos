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
      <div className="bg-primary text-primary-foreground text-center text-xs sm:text-sm py-2 px-4 font-body tracking-wide">
        Frete grátis em compras acima de R$ 199 ✦ Use o cupom <strong>ESDRA10</strong> e ganhe 10% off
      </div>

      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 text-foreground" aria-label="Menu">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link to="/" className="flex items-center gap-2">
              <img src={logoEsdra} alt="Esdra Cosméticos" className="h-10 lg:h-12 w-auto" />
            </Link>

            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link key={link.href} to={link.href} className={`font-body text-sm tracking-wide transition-colors hover:text-primary ${location.pathname === link.href ? "text-primary font-medium" : "text-muted-foreground"}`}>
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-1 sm:gap-2">
              <Button variant="ghost" size="icon" className="text-foreground" aria-label="Buscar"><Search className="w-4 h-4" /></Button>
              <Link to="/conta/favoritos">
                <Button variant="ghost" size="icon" className="text-foreground" aria-label="Favoritos"><Heart className="w-4 h-4" /></Button>
              </Link>
              <Link to="/carrinho">
                <Button variant="ghost" size="icon" className="relative text-foreground" aria-label="Carrinho">
                  <ShoppingBag className="w-4 h-4" />
                  {itemCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground rounded-full w-4 h-4 text-[10px] flex items-center justify-center font-medium">
                      {itemCount > 9 ? "9+" : itemCount}
                    </span>
                  )}
                </Button>
              </Link>
              <Link to="/conta">
                <Button variant="ghost" size="icon" className="text-foreground" aria-label="Minha Conta"><User className="w-4 h-4" /></Button>
              </Link>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden border-t bg-background animate-fade-in">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link key={link.href} to={link.href} onClick={() => setMobileOpen(false)} className={`font-body text-sm py-2 transition-colors ${location.pathname === link.href ? "text-primary font-medium" : "text-muted-foreground"}`}>
                  {link.label}
                </Link>
              ))}
              <div className="border-t pt-3 mt-1">
                <Link to="/admin" onClick={() => setMobileOpen(false)} className="font-body text-xs text-muted-foreground hover:text-primary transition-colors">Acesso Gestor →</Link>
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
