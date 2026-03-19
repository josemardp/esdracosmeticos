import { Outlet, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { User, Package, MapPin, Heart, LogOut } from "lucide-react";

export function AccountLayout() {
  const { user, signOut } = useAuth();

  const links = [
    { label: "Meus Pedidos", href: "/conta/pedidos", icon: Package },
    { label: "Meus Dados", href: "/conta/dados", icon: User },
    { label: "Endereços", href: "/conta/enderecos", icon: MapPin },
    { label: "Favoritos", href: "/conta/favoritos", icon: Heart },
  ];

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      <h1 className="font-display text-2xl lg:text-3xl text-foreground mb-8">Minha Conta</h1>
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
        <aside className="space-y-1">
          {links.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg font-body text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <l.icon className="w-4 h-4" />
              {l.label}
            </Link>
          ))}
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg font-body text-sm text-destructive hover:bg-destructive/10 transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
          <p className="font-body text-xs text-muted-foreground px-4 pt-2 truncate">{user?.email}</p>
        </aside>
        <div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
