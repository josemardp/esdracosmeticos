import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, ShoppingBag, Heart, User, Menu, X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
// Logo recortada só na marca (sem a margem quadrada do arquivo original), com fundo transparente.
import logoEsdra from "@/assets/logo-esdra-wordmark.webp";

// A busca (cmdk) fica fora do pacote inicial: é pré-baixada quando o navegador fica ocioso
// e montada na primeira vez que a lupa é tocada.
const loadSearchDialog = () => import("@/components/search/SearchDialog");
const SearchDialog = lazy(() => loadSearchDialog().then((mod) => ({ default: mod.SearchDialog })));

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
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchUsed, setSearchUsed] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchUsed(true);
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", down);
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 3000));
    idle(() => { loadSearchDialog(); });
    return () => document.removeEventListener("keydown", down);
  }, []);
  const location = useLocation();
  const { itemCount } = useCart();

  // O número da sacola dá um pulinho quando entra item (não quando sai).
  const [bump, setBump] = useState(0);
  const prevCount = useRef(itemCount);
  useEffect(() => {
    if (itemCount > prevCount.current) setBump((b) => b + 1);
    prevCount.current = itemCount;
  }, [itemCount]);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const iconBtn = "inline-flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary";

  return (
    <>
      <div className="bg-foreground px-4 py-2 text-center font-body text-[13px] text-background/90">
        Frete grátis acima de R$ 199 e 3x sem juros no cartão
      </div>

      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-md">
        <div className="shell grid h-16 grid-cols-[1fr_auto_1fr] items-center lg:flex lg:h-[76px] lg:justify-between">
          <div className="flex items-center lg:w-[180px]">
            <button onClick={() => setMobileOpen(!mobileOpen)} className={`${iconBtn} -ml-2 lg:hidden`} aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={mobileOpen}>
              {mobileOpen ? <X className="h-[22px] w-[22px]" /> : <Menu className="h-[22px] w-[22px]" strokeWidth={1.6} />}
            </button>
            <Link to="/" className="hidden lg:block" aria-label="Esdra Cosméticos, página inicial">
              <img src={logoEsdra} alt="Esdra Cosméticos" width={240} height={135} className="h-12 w-auto" />
            </Link>
          </div>

          <Link to="/" className="lg:hidden" aria-label="Esdra Cosméticos, página inicial">
            <img src={logoEsdra} alt="Esdra Cosméticos" width={240} height={135} className="h-10 w-auto" />
          </Link>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Principal">
            {navLinks.map((link) => {
              const active = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`border-b-[1.5px] py-3 font-body text-[15px] transition-colors ${
                    active ? "border-foreground text-foreground" : "border-transparent text-foreground/80 hover:border-foreground hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center justify-end lg:w-[180px]">
            <button type="button" className={iconBtn} aria-label="Buscar produto" onClick={() => { setSearchUsed(true); setSearchOpen(true); }}>
              <Search className="h-[21px] w-[21px]" strokeWidth={1.6} />
            </button>
            <Link to="/conta/favoritos" className={`${iconBtn} hidden sm:inline-flex`} aria-label="Favoritos">
              <Heart className="h-[21px] w-[21px]" strokeWidth={1.6} />
            </Link>
            <Link to="/conta" className={`${iconBtn} hidden sm:inline-flex`} aria-label="Minha conta">
              <User className="h-[21px] w-[21px]" strokeWidth={1.6} />
            </Link>
            <Link to="/carrinho" className={`${iconBtn} relative -mr-2`} aria-label={itemCount > 0 ? `Sacola, ${itemCount} ${itemCount === 1 ? "item" : "itens"}` : "Sacola"}>
              <ShoppingBag className="h-[21px] w-[21px]" strokeWidth={1.6} />
              {itemCount > 0 && (
                <span key={bump} className={`absolute right-1 top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 font-body text-[11px] font-semibold text-primary-foreground ${bump ? "bag-bump" : ""}`}>
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t bg-background lg:hidden">
            <nav className="shell flex flex-col py-3" aria-label="Principal">
              {navLinks.map((link) => {
                const active = location.pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-12 items-center border-b border-border/70 font-display text-[22px] display-md last:border-0 ${active ? "text-primary" : "text-foreground"}`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <div className="flex gap-6 pt-4 font-body text-[15px]">
                <Link to="/conta" onClick={() => setMobileOpen(false)} className="flex min-h-11 items-center gap-2 text-foreground"><User className="h-5 w-5" strokeWidth={1.6} />Minha conta</Link>
                <Link to="/conta/favoritos" onClick={() => setMobileOpen(false)} className="flex min-h-11 items-center gap-2 text-foreground"><Heart className="h-5 w-5" strokeWidth={1.6} />Favoritos</Link>
              </div>
            </nav>
          </div>
        )}
      </header>
      {searchUsed && (
        <Suspense fallback={null}>
          <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
        </Suspense>
      )}
    </>
  );
}
