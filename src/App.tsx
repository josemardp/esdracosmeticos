import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AccountLayout } from "@/components/layout/AccountLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";

// Public pages
import HomePage from "@/pages/HomePage";
import SupportPage from "@/pages/suporte/SupportPage";
import NotFound from "@/pages/NotFound";

// Auth pages
import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import AdminLoginPage from "@/pages/auth/AdminLoginPage";

// Admin pages
import DashboardPage from "@/pages/admin/DashboardPage";
import AdminSupportPage from "@/pages/admin/AdminSupportPage";
import AdminPlaceholder from "@/pages/admin/AdminPlaceholder";

// Account pages
import AccountPlaceholder from "@/pages/conta/AccountPlaceholder";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/suporte" element={<SupportPage />} />
              <Route path="/contato" element={<SupportPage />} />
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
                <Route path="/conta" element={<AccountPlaceholder title="Visão Geral" />} />
                <Route path="/conta/pedidos" element={<AccountPlaceholder title="Meus Pedidos" />} />
                <Route path="/conta/dados" element={<AccountPlaceholder title="Meus Dados" />} />
                <Route path="/conta/enderecos" element={<AccountPlaceholder title="Meus Endereços" />} />
                <Route path="/conta/favoritos" element={<AccountPlaceholder title="Meus Favoritos" />} />
              </Route>
            </Route>

            {/* Protected admin routes */}
            <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route path="/admin" element={<DashboardPage />} />
              <Route path="/admin/produtos" element={<AdminPlaceholder title="Produtos" />} />
              <Route path="/admin/categorias" element={<AdminPlaceholder title="Categorias" />} />
              <Route path="/admin/pedidos" element={<AdminPlaceholder title="Pedidos" />} />
              <Route path="/admin/clientes" element={<AdminPlaceholder title="Clientes" />} />
              <Route path="/admin/estoque" element={<AdminPlaceholder title="Estoque" />} />
              <Route path="/admin/cupons" element={<AdminPlaceholder title="Cupons" />} />
              <Route path="/admin/conteudo" element={<AdminPlaceholder title="Conteúdo" />} />
              <Route path="/admin/suporte" element={<AdminSupportPage />} />
              <Route path="/admin/integracoes" element={<AdminPlaceholder title="Integrações" />} />
              <Route path="/admin/configuracoes" element={<AdminPlaceholder title="Configurações" />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
