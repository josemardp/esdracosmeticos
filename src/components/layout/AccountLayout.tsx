import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { User, Package, MapPin, Heart, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function AccountLayout() {
  const { user, signOut } = useAuth();
  const { pathname } = useLocation();

  const links = [
    { label: "Pedidos", href: "/conta/pedidos", icon: Package },
    { label: "Meus dados", href: "/conta/dados", icon: User },
    { label: "Endereços", href: "/conta/enderecos", icon: MapPin },
    { label: "Favoritos", href: "/conta/favoritos", icon: Heart },
  ];
  // "/conta" sozinho mostra os pedidos.
  const isActive = (href: string) => pathname.startsWith(href) || (href === "/conta/pedidos" && pathname === "/conta");

  return (
    <div className="shell pb-16 pt-8 font-body lg:pb-24 lg:pt-12">
      <div className="mb-6 flex items-end justify-between gap-4 lg:mb-10">
        <div className="min-w-0">
          <h1 className="font-display text-[34px] leading-tight text-foreground display-md lg:text-[44px]">Minha conta</h1>
          <p className="mt-1 truncate text-[15px] text-muted-foreground">{user?.email}</p>
        </div>
        <button
          onClick={signOut}
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-3 text-[15px] font-medium text-foreground hover:bg-secondary lg:hidden"
        >
          <LogOut className="h-4 w-4" aria-hidden /> Sair
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr] lg:gap-12">
        <nav aria-label="Minha conta" className="-mx-4 lg:mx-0">
          <ul className="no-scrollbar flex gap-2 overflow-x-auto px-4 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0">
            {links.map((l) => {
              const active = isActive(l.href);
              return (
                <li key={l.href} className="shrink-0">
                  <Link
                    to={l.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-11 items-center gap-2.5 rounded-full px-4 text-[15px] transition-colors",
                      active
                        ? "bg-primary font-medium text-primary-foreground"
                        : "text-foreground shadow-[inset_0_0_0_1px_hsl(var(--foreground)/0.2)] hover:bg-secondary lg:shadow-none",
                    )}
                  >
                    <l.icon className="h-4 w-4" aria-hidden />
                    {l.label}
                  </Link>
                </li>
              );
            })}
            <li className="hidden lg:block">
              <button onClick={signOut} className="mt-4 flex h-11 w-full items-center gap-2.5 rounded-full px-4 text-[15px] text-foreground hover:bg-secondary">
                <LogOut className="h-4 w-4" aria-hidden /> Sair
              </button>
            </li>
          </ul>
        </nav>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
