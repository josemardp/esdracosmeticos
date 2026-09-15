import { useEffect, lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AccountLayout } from "@/components/layout/AccountLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";

// Public pages
import HomePage from "@/pages/HomePage";
import CatalogPage from "@/pages/loja/CatalogPage";
import ProductPage from "@/pages/loja/ProductPage";
import CartPage from "@/pages/loja/CartPage";
import CheckoutPage from "@/pages/loja/CheckoutPage";
import SupportPage from "@/pages/suporte/SupportPage";
import SobrePage from "@/pages/SobrePage";
import NotFound from "@/pages/NotFound";

// Auth pages
import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
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
const AdminPlaceholder = lazy(() => import("@/pages/admin/AdminPlaceholder"));
const AdminCampaignsPage = lazy(() => import("@/pages/admin/AdminCampaignsPage"));
const CrediarioPage = lazy(() => import("@/pages/admin/CrediarioPage"));
const AdminImportNFePage = lazy(() => import("@/pages/admin/AdminImportNFePage"));
const AdminImportCSVPage = lazy(() => import("@/pages/admin/AdminImportCSVPage"));
const AdminSettingsPage = lazy(() => import("@/pages/admin/AdminSettingsPage"));
const AdminContentPage = lazy(() => import("@/pages/admin/AdminContentPage"));

// Gestão pages (lazy)
const GestaoDashboardPage = lazy(() => import("@/pages/admin/gestao/GestaoDashboardPage"));
const VendaRapidaPage = lazy(() => import("@/pages/admin/gestao/VendaRapidaPage"));
const VendasPage = lazy(() => import("@/pages/admin/gestao/VendasPage"));
const VendasConsolidadasPage = lazy(() => import("@/pages/admin/gestao/VendasConsolidadasPage"));
const ReceberPage = lazy(() => import("@/pages/admin/gestao/ReceberPage"));
const CaixaPage = lazy(() => import("@/pages/admin/gestao/CaixaPage"));
const GestaoClientesPage = lazy(() => import("@/pages/admin/gestao/GestaoClientesPage"));
const FornecedoresPage = lazy(() => import("@/pages/admin/gestao/FornecedoresPage"));
const ComprasPage = lazy(() => import("@/pages/admin/gestao/ComprasPage"));
const PagarPage = lazy(() => import("@/pages/admin/gestao/PagarPage"));
const VencimentosPage = lazy(() => import("@/pages/admin/gestao/VencimentosPage"));
const ProjecaoPage = lazy(() => import("@/pages/admin/gestao/ProjecaoPage"));
const CategoriasFinanceirasPage = lazy(() => import("@/pages/admin/gestao/CategoriasFinanceirasPage"));
const CentrosCustoPage = lazy(() => import("@/pages/admin/gestao/CentrosCustoPage"));
const RelatoriosPage = lazy(() => import("@/pages/admin/gestao/RelatoriosPage"));
const ResultadoPage = lazy(() => import("@/pages/admin/gestao/ResultadoPage"));

// Phase 4 (lazy)
const RecebimentoComprasPage = lazy(() => import("@/pages/admin/gestao/RecebimentoComprasPage"));
const MovimentosEstoquePage = lazy(() => import("@/pages/admin/gestao/MovimentosEstoquePage"));
const MargemPage = lazy(() => import("@/pages/admin/gestao/MargemPage"));
const ReposicaoPage = lazy(() => import("@/pages/admin/gestao/ReposicaoPage"));

// Phase 5 (lazy)
const CRMPage = lazy(() => import("@/pages/admin/gestao/CRMPage"));
const SegmentosPage = lazy(() => import("@/pages/admin/gestao/SegmentosPage"));
const NewsletterGestaoPage = lazy(() => import("@/pages/admin/gestao/NewsletterGestaoPage"));
const ReativacaoPage = lazy(() => import("@/pages/admin/gestao/ReativacaoPage"));

// Phase 6 (lazy)
const ExecutivoPage = lazy(() => import("@/pages/admin/gestao/ExecutivoPage"));
const CanaisPage = lazy(() => import("@/pages/admin/gestao/CanaisPage"));
const ProdutosResultadoPage = lazy(() => import("@/pages/admin/gestao/ProdutosResultadoPage"));
const ExportacoesPage = lazy(() => import("@/pages/admin/gestao/ExportacoesPage"));
const AuditoriaPage = lazy(() => import("@/pages/admin/gestao/AuditoriaPage"));
const IntegracoesAvancadasPage = lazy(() => import("@/pages/admin/gestao/IntegracoesAvancadasPage"));

// Account pages (lazy)
const ProfilePage = lazy(() => import("@/pages/conta/ProfilePage"));
const OrdersPage = lazy(() => import("@/pages/conta/OrdersPage"));
const OrderDetailPage = lazy(() => import("@/pages/conta/OrderDetailPage"));
const FavoritesPage = lazy(() => import("@/pages/conta/FavoritesPage"));
const AccountPlaceholder = lazy(() => import("@/pages/conta/AccountPlaceholder"));
const AddressesPage = lazy(() => import("@/pages/conta/AddressesPage"));

// Institutional pages
import PoliticaPrivacidadePage from "@/pages/institucional/PoliticaPrivacidadePage";
import TrocasDevolucoesPage from "@/pages/institucional/TrocasDevolucoesPage";
import TermosDeUsoPage from "@/pages/institucional/TermosDeUsoPage";

const queryClient = new QueryClient();

const ManifestSwitcher = () => {
  const location = useLocation();
  useEffect(() => {
    const link = document.getElementById('pwa-manifest') as HTMLLinkElement | null;
    if (!link) return;
    const isAdmin = location.pathname.startsWith('/admin');
    link.href = isAdmin ? '/admin.webmanifest' : '/manifest.webmanifest';
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
            </Route>

            {/* Auth routes (no layout) */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/cadastro" element={<SignupPage />} />
            <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
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
              <Route path="/admin/crediario-calculadora" element={<CrediarioPage />} />
              <Route path="/admin/suporte" element={<AdminSupportPage />} />
              <Route path="/admin/integracoes" element={<AdminIntegrationsPage />} />
              <Route path="/admin/configuracoes" element={<AdminSettingsPage />} />
              {/* Gestão routes */}
              <Route path="/admin/gestao" element={<GestaoDashboardPage />} />
              <Route path="/admin/gestao/dashboard" element={<GestaoDashboardPage />} />
              <Route path="/admin/gestao/venda-rapida" element={<VendaRapidaPage />} />
              <Route path="/admin/gestao/vendas" element={<VendasPage />} />
              <Route path="/admin/gestao/consolidado" element={<VendasConsolidadasPage />} />
              <Route path="/admin/gestao/receber" element={<ReceberPage />} />
              <Route path="/admin/gestao/caixa" element={<CaixaPage />} />
              <Route path="/admin/gestao/clientes" element={<GestaoClientesPage />} />
              <Route path="/admin/gestao/fornecedores" element={<FornecedoresPage />} />
              <Route path="/admin/gestao/compras" element={<ComprasPage />} />
              <Route path="/admin/gestao/pagar" element={<PagarPage />} />
              <Route path="/admin/gestao/vencimentos" element={<VencimentosPage />} />
              <Route path="/admin/gestao/projecao" element={<ProjecaoPage />} />
              <Route path="/admin/gestao/categorias-financeiras" element={<CategoriasFinanceirasPage />} />
              <Route path="/admin/gestao/centros-custo" element={<CentrosCustoPage />} />
              <Route path="/admin/gestao/relatorios" element={<RelatoriosPage />} />
              <Route path="/admin/gestao/resultado" element={<ResultadoPage />} />
              {/* Phase 4 */}
              <Route path="/admin/gestao/recebimento-compras" element={<RecebimentoComprasPage />} />
              <Route path="/admin/gestao/movimentos-estoque" element={<MovimentosEstoquePage />} />
              <Route path="/admin/gestao/margem" element={<MargemPage />} />
              <Route path="/admin/gestao/reposicao" element={<ReposicaoPage />} />
              {/* Phase 5 */}
              <Route path="/admin/gestao/crm" element={<CRMPage />} />
              <Route path="/admin/gestao/segmentos" element={<SegmentosPage />} />
              <Route path="/admin/gestao/newsletter" element={<NewsletterGestaoPage />} />
              <Route path="/admin/gestao/reativacao" element={<ReativacaoPage />} />
              {/* Phase 6 */}
              <Route path="/admin/gestao/executivo" element={<ExecutivoPage />} />
              <Route path="/admin/gestao/canais" element={<CanaisPage />} />
              <Route path="/admin/gestao/produtos-resultado" element={<ProdutosResultadoPage />} />
              <Route path="/admin/gestao/exportacoes" element={<ExportacoesPage />} />
              <Route path="/admin/gestao/auditoria" element={<AuditoriaPage />} />
              <Route path="/admin/gestao/integracoes-avancadas" element={<IntegracoesAvancadasPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;