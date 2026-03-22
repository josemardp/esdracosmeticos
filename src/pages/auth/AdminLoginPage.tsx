import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Shield } from "lucide-react";
import logoEsdra from "@/assets/logo-esdra.png";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [waitingAuth, setWaitingAuth] = useState(false);
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();

  // When AuthContext confirms admin, navigate
  useEffect(() => {
    if (waitingAuth && isAdmin && user) {
      navigate("/admin", { replace: true });
    }
  }, [waitingAuth, isAdmin, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
      return;
    }
    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "admin")
      .maybeSingle();
    setLoading(false);
    if (!roleData) {
      await supabase.auth.signOut();
      toast({ title: "Acesso negado", description: "Você não tem permissão de gestor.", variant: "destructive" });
      return;
    }
    // Wait for AuthContext to pick up admin status before navigating
    setWaitingAuth(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-foreground px-4">
      <div className="w-full max-w-md bg-card border rounded-xl p-8 shadow-elegant">
        <div className="text-center mb-8">
          <Link to="/">
            <img src={logoEsdra} alt="Esdra Cosméticos" className="h-12 mx-auto mb-4 logo-enhance" />
          </Link>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="font-display text-2xl text-foreground">Painel do Gestor</h1>
          </div>
          <p className="font-body text-sm text-muted-foreground">
            Acesso restrito à equipe Esdra Cosméticos
          </p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email" className="font-body text-sm">E-mail</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="gestor@esdra.com" />
          </div>
          <div>
            <Label htmlFor="password" className="font-body text-sm">Senha</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Verificando..." : "Acessar Painel"}
          </Button>
        </form>
        <p className="text-center font-body text-xs text-muted-foreground mt-6">
          <Link to="/" className="hover:text-primary transition-colors">
            ← Voltar ao site
          </Link>
        </p>
      </div>
    </div>
  );
}
