import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Package, FolderTree, ShoppingCart, Users,
  Boxes, Ticket, FileText, Headphones, Link2, Settings, LogOut, Menu, X, ChevronRight, Megaphone,
  Briefcase, Zap, Clock, Wallet, UserCheck, BarChart3,
  Building2, ShoppingBag, CreditCard, CalendarDays, TrendingUp,
  Tag, Landmark, FileBarChart, PieChart,
  PackageCheck, ArrowDownUp, Percent, AlertTriangle,
  UserPlus, Filter, Mail, UserMinus,
  Gauge, Radio, PackageSearch, Download, Shield, Link as LinkIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logoEsdra from "@/assets/logo-esdra.png";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

const navSections = [
  {
    title: "Gestão",
    items: [
      { label: "Painel Gestão", href: "/admin/gestao/dashboard", icon: Briefcase },
      { label: "Executivo", href: "/admin/gestao/executivo", icon: Gauge },
      { label: "Venda Rápida", href: "/admin/gestao/venda-rapida", icon: Zap },
      { label: "Vendas", href: "/admin/gestao/vendas", icon: ShoppingCart },
      { label: "Consolidado", href: "/admin/gestao/consolidado", icon: BarChart3 },
      { label: "Contas a Receber", href: "/admin/gestao/receber", icon: Clock },
      { label: "Caixa", href: "/admin/gestao/caixa", icon: Wallet },
      { label: "Clientes Gestão", href: "/admin/gestao/clientes", icon: UserCheck },
      { label: "Fornecedores", href: "/admin/gestao/fornecedores", icon: Building2 },
      { label: "Compras", href: "/admin/gestao/compras", icon: ShoppingBag },
      { label: "Contas a Pagar", href: "/admin/gestao/pagar", icon: CreditCard },
      { label: "Vencimentos", href: "/admin/gestao/vencimentos", icon: CalendarDays },
      { label: "Projeção", href: "/admin/gestao/projecao", icon: TrendingUp },
      { label: "Cat. Financeiras", href: "/admin/gestao/categorias-financeiras", icon: Tag },
      { label: "Centros de Custo", href: "/admin/gestao/centros-custo", icon: Landmark },
      { label: "Relatórios", href: "/admin/gestao/relatorios", icon: FileBarChart },
      { label: "Resultado", href: "/admin/gestao/resultado", icon: PieChart },
      { label: "Canais", href: "/admin/gestao/canais", icon: Radio },
    ],
  },
  {
    title: "Estoque & Margem",
    items: [
      { label: "Receb. Compras", href: "/admin/gestao/recebimento-compras", icon: PackageCheck },
      { label: "Mov. Estoque", href: "/admin/gestao/movimentos-estoque", icon: ArrowDownUp },
      { label: "Margem", href: "/admin/gestao/margem", icon: Percent },
      { label: "Reposição", href: "/admin/gestao/reposicao", icon: AlertTriangle },
      { label: "Prod. Resultado", href: "/admin/gestao/produtos-resultado", icon: PackageSearch },
    ],
  },
  {
    title: "CRM",
    items: [
      { label: "CRM", href: "/admin/gestao/crm", icon: UserPlus },
      { label: "Segmentos", href: "/admin/gestao/segmentos", icon: Filter },
      { label: "Newsletter", href: "/admin/gestao/newsletter", icon: Mail },
      { label: "Reativação", href: "/admin/gestao/reativacao", icon: UserMinus },
    ],
  },
  {
    title: "BI & Escala",
    items: [
      { label: "Exportações", href: "/admin/gestao/exportacoes", icon: Download },
      { label: "Auditoria", href: "/admin/gestao/auditoria", icon: Shield },
      { label: "Integ. Avançadas", href: "/admin/gestao/integracoes-avancadas", icon: LinkIcon },
    ],
  },
  {
    title: "E-commerce",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Produtos", href: "/admin/produtos", icon: Package },
      { label: "Categorias", href: "/admin/categorias", icon: FolderTree },
      { label: "Pedidos", href: "/admin/pedidos", icon: ShoppingCart },
      { label: "Clientes", href: "/admin/clientes", icon: Users },
      { label: "Estoque", href: "/admin/estoque", icon: Boxes },
      { label: "Cupons", href: "/admin/cupons", icon: Ticket },
      { label: "Campanhas", href: "/admin/campanhas", icon: Megaphone },
      { label: "Conteúdo", href: "/admin/conteudo", icon: FileText },
      { label: "Suporte", href: "/admin/suporte", icon: Headphones },
      { label: "Integrações", href: "/admin/integracoes", icon: Link2 },
      { label: "Configurações", href: "/admin/configuracoes", icon: Settings },
    ],
  },
];



export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (href: string) => {
    if (href === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen flex bg-secondary">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex lg:w-64 flex-col bg-card border-r">
        <div className="p-4 border-b">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoEsdra} alt="Esdra" className="h-8 logo-enhance" />
            <div>
              <span className="font-display text-lg font-semibold text-foreground leading-none block">Esdra</span>
              <span className="font-body text-[9px] text-muted-foreground tracking-[0.15em] uppercase">Painel Gestor</span>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.title}>
              <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">{section.title}</p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg font-body text-sm transition-colors ${
                      isActive(item.href)
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-3 border-t">
          <div className="font-body text-xs text-muted-foreground truncate mb-2 px-3">
            {user?.email}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-body text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b h-14 flex items-center justify-between px-4">
        <button onClick={() => setSidebarOpen(true)} className="p-2">
          <Menu className="w-5 h-5 text-foreground" />
        </button>
        <Link to="/admin" className="flex items-center gap-2">
          <img src={logoEsdra} alt="Esdra" className="h-6 logo-enhance" />
          <span className="font-display text-sm font-semibold">Gestor</span>
        </Link>
        <div className="w-9" />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-72 bg-card flex flex-col animate-fade-in">
            <div className="p-4 border-b flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2">
                <img src={logoEsdra} alt="Esdra" className="h-8 logo-enhance" />
              </Link>
              <button onClick={() => setSidebarOpen(false)} className="p-1">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
              {navSections.map((section) => (
                <div key={section.title}>
                  <p className="font-body text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">{section.title}</p>
                  <div className="space-y-0.5">
                    {section.items.map((item) => (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-body text-sm transition-colors ${
                          isActive(item.href)
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                        <ChevronRight className="w-3 h-3 ml-auto opacity-30" />
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
            <div className="p-3 border-t">
              <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-body text-sm text-destructive w-full">
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-0 mt-14 lg:mt-0 min-h-screen">
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
      {location.pathname === "/admin" && (
        <InstallPrompt
          dismissKey="pwa-install-dismissed-admin"
          label="Instalar Esdra Admin"
        />
      )}
    </div>
  );
}
