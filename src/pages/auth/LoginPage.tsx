import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { AuthShell, authButton, authErrorMessage, authField, authLabel, authLink } from "@/components/store/AuthShell";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/conta";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Não foi possível entrar", description: authErrorMessage(error.message), variant: "destructive" });
    } else {
      navigate(from, { replace: true });
    }
  };

  return (
    <AuthShell
      title="Entrar na sua conta"
      subtitle="Veja seus pedidos, endereços e favoritos."
      footer={<>Ainda não tem conta? <Link to="/cadastro" className={authLink}>Criar conta</Link></>}
    >
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <Label htmlFor="email" className={authLabel}>E-mail</Label>
          <Input id="email" type="email" className={authField} value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="seu@email.com" />
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <Label htmlFor="password" className={authLabel}>Senha</Label>
            <Link to="/recuperar-senha" className={`${authLink} text-[15px]`}>Esqueci a senha</Link>
          </div>
          <Input id="password" type="password" className={authField} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </div>
        <button type="submit" className={authButton} disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </AuthShell>
  );
}
