import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import logoEsdra from "@/assets/logo-esdra.png";

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
      toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
    } else {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary px-4">
      <div className="w-full max-w-md bg-card border rounded-xl p-8 shadow-elegant">
        <div className="text-center mb-8">
          <Link to="/">
            <img src={logoEsdra} alt="Esdra Cosméticos" className="h-12 mx-auto mb-4" />
          </Link>
          <h1 className="font-display text-2xl text-foreground">Entrar na sua conta</h1>
          <p className="font-body text-sm text-muted-foreground mt-1">
            Acesse seus pedidos e favoritos
          </p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email" className="font-body text-sm">E-mail</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="seu@email.com" />
          </div>
          <div>
            <Label htmlFor="password" className="font-body text-sm">Senha</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          <div className="text-right">
            <Link to="/recuperar-senha" className="font-body text-xs text-primary hover:underline">
              Esqueci minha senha
            </Link>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
        <p className="text-center font-body text-sm text-muted-foreground mt-6">
          Não tem conta?{" "}
          <Link to="/cadastro" className="text-primary hover:underline font-medium">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
