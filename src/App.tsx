import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
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
import AdminLoginPage from "@/pages/auth/AdminLoginPage";

// Admin pages
import DashboardPage from "@/pages/admin/DashboardPage";
import AdminProductsPage from "@/pages/admin/AdminProductsPage";
import AdminCategoriesPage from "@/pages/admin/AdminCategoriesPage";
import AdminOrdersPage from "@/pages/admin/AdminOrdersPage";
import AdminCustomersPage from "@/pages/admin/AdminCustomersPage";
import AdminStockPage from "@/pages/admin/AdminStockPage";
import AdminCouponsPage from "@/pages/admin/AdminCouponsPage";
import AdminSupportPage from "@/pages/admin/AdminSupportPage";
import AdminIntegrationsPage from "@/pages/admin/AdminIntegrationsPage";
import AdminPlaceholder from "@/pages/admin/AdminPlaceholder";
import AdminCampaignsPage from "@/pages/admin/AdminCampaignsPage";

// Gestão pages
import GestaoDashboardPage from "@/pages/admin/gestao/GestaoDashboardPage";
import VendaRapidaPage from "@/pages/admin/gestao/VendaRapidaPage";
import VendasPage from "@/pages/admin/gestao/VendasPage";
import VendasConsolidadasPage from "@/pages/admin/gestao/VendasConsolidadasPage";
import ReceberPage from "@/pages/admin/gestao/ReceberPage";
import CaixaPage from "@/pages/admin/gestao/CaixaPage";
import GestaoClientesPage from "@/pages/admin/gestao/GestaoClientesPage";
import FornecedoresPage from "@/pages/admin/gestao/FornecedoresPage";
import ComprasPage from "@/pages/admin/gestao/ComprasPage";
import PagarPage from "@/pages/admin/gestao/PagarPage";
import VencimentosPage from "@/pages/admin/gestao/VencimentosPage";
import ProjecaoPage from "@/pages/admin/gestao/ProjecaoPage";
import CategoriasFinanceirasPage from "@/pages/admin/gestao/CategoriasFinanceirasPage";
import CentrosCustoPage from "@/pages/admin/gestao/CentrosCustoPage";
import RelatoriosPage from "@/pages/admin/gestao/RelatoriosPage";
import ResultadoPage from "@/pages/admin/gestao/ResultadoPage";

// Phase 4
import RecebimentoComprasPage from "@/pages/admin/gestao/RecebimentoComprasPage";
import MovimentosEstoquePage from "@/pages/admin/gestao/MovimentosEstoquePage";
import MargemPage from "@/pages/admin/gestao/MargemPage";
import ReposicaoPage from "@/pages/admin/gestao/ReposicaoPage";

// Phase 5
import CRMPage from "@/pages/admin/gestao/CRMPage";
import SegmentosPage from "@/pages/admin/gestao/SegmentosPage";
import NewsletterGestaoPage from "@/pages/admin/gestao/NewsletterGestaoPage";
import ReativacaoPage from "@/pages/admin/gestao/ReativacaoPage";

// Phase 6
import ExecutivoPage from "@/pages/admin/gestao/ExecutivoPage";
import CanaisPage from "@/pages/admin/gestao/CanaisPage";
import ProdutosResultadoPage from "@/pages/admin/gestao/ProdutosResultadoPage";
import ExportacoesPage from "@/pages/admin/gestao/ExportacoesPage";
import AuditoriaPage from "@/pages/admin/gestao/AuditoriaPage";
import IntegracoesAvancadasPage from "@/pages/admin/gestao/IntegracoesAvancadasPage";

// Account pages
import ProfilePage from "@/pages/conta/ProfilePage";
import OrdersPage from "@/pages/conta/OrdersPage";
import OrderDetailPage from "@/pages/conta/OrderDetailPage";
import FavoritesPage from "@/pages/conta/FavoritesPage";
import AccountPlaceholder from "@/pages/conta/AccountPlaceholder";
import AddressesPage from "@/pages/conta/AddressesPage";
import AdminSettingsPage from "@/pages/admin/AdminSettingsPage";
import AdminContentPage from "@/pages/admin/AdminContentPage";

// Institutional pages
import PoliticaPrivacidadePage from "@/pages/institucional/PoliticaPrivacidadePage";
import TrocasDevolucoesPage from "@/pages/institucional/TrocasDevolucoesPage";
import TermosDeUsoPage from "@/pages/institucional/TermosDeUsoPage";

const queryClient = new QueryClient();

const ManifestSwitcher = () => {
  useEffect(() => {
    const link = document.getElementById('pwa-manifest') as HTMLLinkElement | null;
    if (!link) return;
    const isAdmin = window.location.pathname.startsWith('/admin');
    link.href = isAdmin ? '/admin.webmanifest' : '/manifest.webmanifest';
  }, []);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
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
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Protected client routes */}
            <Route element={<ProtectedRoute><PublicLayout /></ProtectedRoute>}>
              <Route element={<AccountLayout />}>
                <Route path="/conta" element={<OrdersPage />} />
                <Route path="/conta/pedidos" element={<OrdersPage />} />
                <Route path="/conta/pedidos/:id" element={<OrderDetailPage />} />
                <Route path="/conta/dados" element={<ProfilePage />} />
                <Route path="/conta/enderecos" element={<AddressesPage />} />
                <Route path="/conta/favoritos" element={<FavoritesPage />} />
              </Route>
            </Route>

            {/* Protected admin routes */}
            <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route path="/admin" element={<DashboardPage />} />
              <Route path="/admin/produtos" element={<AdminProductsPage />} />
              <Route path="/admin/categorias" element={<AdminCategoriesPage />} />
              <Route path="/admin/pedidos" element={<AdminOrdersPage />} />
              <Route path="/admin/clientes" element={<AdminCustomersPage />} />
              <Route path="/admin/estoque" element={<AdminStockPage />} />
              <Route path="/admin/cupons" element={<AdminCouponsPage />} />
              <Route path="/admin/conteudo" element={<AdminContentPage />} />
              <Route path="/admin/campanhas" element={<AdminCampaignsPage />} />
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
