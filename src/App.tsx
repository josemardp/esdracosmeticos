import { useEffect, lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { LazyMotion } from "framer-motion";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { PublicLayout } from "@/components/layout/PublicLayout";
const AdminLayout = lazy(() => import("@/components/layout/AdminLayout").then((mod) => ({ default: mod.AdminLayout })));
const AccountLayout = lazy(() => import("@/components/layout/AccountLayout").then((mod) => ({ default: mod.AccountLayout })));
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";

// Public pages: as portas de entrada (home, catálogo, produto) vão no pacote inicial;
// as demais carregam sob demanda (PublicLayout tem o Suspense).
import HomePage from "@/pages/HomePage";
import CatalogPage from "@/pages/loja/CatalogPage";
import ProductPage from "@/pages/loja/ProductPage";
const CartPage = lazy(() => import("@/pages/loja/CartPage"));
const CheckoutPage = lazy(() => import("@/pages/loja/CheckoutPage"));
const SupportPage = lazy(() => import("@/pages/suporte/SupportPage"));
const SobrePage = lazy(() => import("@/pages/SobrePage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Auth pages (lazy)
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const SignupPage = lazy(() => import("@/pages/auth/SignupPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/auth/ResetPasswordPage"));
const AdminLoginPage = lazy(() => import("@/pages/auth/AdminLoginPage"));

// Admin pages (lazy)
const DashboardPage = lazy(() => import("@/pages/admin/DashboardPage"));
const AdminProductsPage = lazy(() => import("@/pages/admin/AdminProductsPage"));
const AdminCategoriesPage = lazy(() => import("@/pages/admin/AdminCategoriesPage"));
const AdminOrdersPage = lazy(() => import("@/pages/admin/AdminOrdersPage"));
const AdminCustomersPage = lazy(() => import("@/pages/admin/AdminCustomersPage"));
const AdminStockPage = lazy(() => import("@/pages/admin/AdminStockPage"));
const AdminCouponsPage = lazy(() => import("@/pages/admin/AdminCouponsPage"));
const AdminSupportPage = lazy(() => import("@/pages/admin/AdminSupportPage"));
const AdminIntegrationsPage = lazy(() => import("@/pages/admin/AdminIntegrationsPage"));
const AdminCampaignsPage = lazy(() => import("@/pages/admin/AdminCampaignsPage"));
const AdminImportNFePage = lazy(() => import("@/pages/admin/AdminImportNFePage"));
const AdminImportCSVPage = lazy(() => import("@/pages/admin/AdminImportCSVPage"));
const AdminSettingsPage = lazy(() => import("@/pages/admin/AdminSettingsPage"));
const AdminContentPage = lazy(() => import("@/pages/admin/AdminContentPage"));

const MargemPage = lazy(() => import("@/pages/admin/MargemPage"));
const ReposicaoPage = lazy(() => import("@/pages/admin/ReposicaoPage"));

// Account pages (lazy)
const ProfilePage = lazy(() => import("@/pages/conta/ProfilePage"));
const OrdersPage = lazy(() => import("@/pages/conta/OrdersPage"));
const OrderDetailPage = lazy(() => import("@/pages/conta/OrderDetailPage"));
const FavoritesPage = lazy(() => import("@/pages/conta/FavoritesPage"));
const AccountPlaceholder = lazy(() => import("@/pages/conta/AccountPlaceholder"));
const AddressesPage = lazy(() => import("@/pages/conta/AddressesPage"));

// Institutional pages (lazy)
const PoliticaPrivacidadePage = lazy(() => import("@/pages/institucional/PoliticaPrivacidadePage"));
const TrocasDevolucoesPage = lazy(() => import("@/pages/institucional/TrocasDevolucoesPage"));
const TermosDeUsoPage = lazy(() => import("@/pages/institucional/TermosDeUsoPage"));

// Motor das animações carregado depois da página; as páginas usam <m.div> (ver motion-features.ts).
const loadMotionFeatures = () => import("@/lib/motion-features").then((mod) => mod.default);

const queryClient = new QueryClient();

// Fontes do admin (as de antes do redesenho). A loja não baixa essas; só quem abre o /admin.
const ADMIN_FONTS_HREF = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Inter:wght@300;400;500;600;700&display=swap";

const ManifestSwitcher = () => {
  const location = useLocation();
  useEffect(() => {
    const isAdmin = location.pathname.startsWith('/admin');
    const link = document.getElementById('pwa-manifest') as HTMLLinkElement | null;
    if (link) link.href = isAdmin ? '/admin.webmanifest' : '/manifest.webmanifest';
    // O admin mantém as cores e fontes antigas (bloco .admin-ui do index.css).
    document.documentElement.classList.toggle('admin-ui', isAdmin);
    if (isAdmin && !document.getElementById('admin-fonts')) {
      const css = document.createElement('link');
      css.id = 'admin-fonts'; css.rel = 'stylesheet'; css.href = ADMIN_FONTS_HREF;
      document.head.appendChild(css);
    }
  }, [location.pathname]);
  return null;
};

const RouteLoading = () => (
  <div className="flex h-64 w-full items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <LazyMotion features={loadMotionFeatures} strict>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
          <ManifestSwitcher />
          <ScrollToTop />
          <Routes>
            {/* Public routes with layout */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/loja" element={<CatalogPage />} />
              <Route path="/lancamentos" element={<CatalogPage />} />
              <Route path="/promocoes" element={<CatalogPage />} />
              <Route path="/produto/:slug" element={<ProductPage />} />
              <Route path="/carrinho" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/suporte" element={<SupportPage />} />
              <Route path="/sobre" element={<SobrePage />} />
              <Route path="/contato" element={<SupportPage />} />
              <Route path="/politica-de-privacidade" element={<PoliticaPrivacidadePage />} />
              <Route path="/trocas-e-devolucoes" element={<TrocasDevolucoesPage />} />
              <Route path="/termos-de-uso" element={<TermosDeUsoPage />} />
              {/* Página não encontrada, com o cabeçalho e o rodapé da loja */}
              <Route path="*" element={<NotFound />} />
            </Route>

            {/* Auth routes (no layout) */}
            <Route path="/login" element={<Suspense fallback={<RouteLoading />}><LoginPage /></Suspense>} />
            <Route path="/cadastro" element={<Suspense fallback={<RouteLoading />}><SignupPage /></Suspense>} />
            <Route path="/recuperar-senha" element={<Suspense fallback={<RouteLoading />}><ForgotPasswordPage /></Suspense>} />
            <Route path="/reset-password" element={<Suspense fallback={<RouteLoading />}><ResetPasswordPage /></Suspense>} />
            <Route path="/admin/login" element={<Suspense fallback={<RouteLoading />}><AdminLoginPage /></Suspense>} />

            {/* Protected client routes */}
            <Route element={<ProtectedRoute><PublicLayout /></ProtectedRoute>}>
              <Route element={<Suspense fallback={<RouteLoading />}><AccountLayout /></Suspense>}>
                <Route path="/conta" element={<OrdersPage />} />
                <Route path="/conta/pedidos" element={<OrdersPage />} />
                <Route path="/conta/pedidos/:id" element={<OrderDetailPage />} />
                <Route path="/conta/dados" element={<ProfilePage />} />
                <Route path="/conta/enderecos" element={<AddressesPage />} />
                <Route path="/conta/favoritos" element={<FavoritesPage />} />
              </Route>
            </Route>

            {/* Protected admin routes */}
            <Route element={<AdminRoute><Suspense fallback={<RouteLoading />}><AdminLayout /></Suspense></AdminRoute>}>
              <Route path="/admin" element={<DashboardPage />} />
              <Route path="/admin/produtos" element={<AdminProductsPage />} />
              <Route path="/admin/categorias" element={<AdminCategoriesPage />} />
              <Route path="/admin/pedidos" element={<AdminOrdersPage />} />
              <Route path="/admin/clientes" element={<AdminCustomersPage />} />
              <Route path="/admin/estoque" element={<AdminStockPage />} />
              <Route path="/admin/importar-nfe" element={<AdminImportNFePage />} />
              <Route path="/admin/importar-csv" element={<AdminImportCSVPage />} />
              <Route path="/admin/cupons" element={<AdminCouponsPage />} />
              <Route path="/admin/conteudo" element={<AdminContentPage />} />
              <Route path="/admin/campanhas" element={<AdminCampaignsPage />} />
              <Route path="/admin/suporte" element={<AdminSupportPage />} />
              <Route path="/admin/integracoes" element={<AdminIntegrationsPage />} />
              <Route path="/admin/configuracoes" element={<AdminSettingsPage />} />
              <Route path="/admin/margem" element={<MargemPage />} />
              <Route path="/admin/reposicao" element={<ReposicaoPage />} />
              <Route path="/admin/gestao/margem" element={<Navigate to="/admin/margem" replace />} />
              <Route path="/admin/gestao/reposicao" element={<Navigate to="/admin/reposicao" replace />} />
              <Route path="/admin/gestao/*" element={<Navigate to="/admin" replace />} />
              <Route path="/admin/gestao" element={<Navigate to="/admin" replace />} />
            </Route>

          </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
      </LazyMotion>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;