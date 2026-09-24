import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { AuthShell, authButton, authErrorMessage, authField, authLabel, authLink } from "@/components/store/AuthShell";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Senha muito curta", description: "Use no mínimo 6 caracteres.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Não foi possível criar a conta", description: authErrorMessage(error.message), variant: "destructive" });
    } else {
      toast({ title: "Conta criada", description: "Enviamos um link para o seu e-mail. Abra o link para confirmar o cadastro." });
      navigate("/login");
    }
  };

  return (
    <AuthShell
      title="Criar sua conta"
      subtitle="Acompanhe seus pedidos e guarde seus favoritos."
      footer={<>Já tem conta? <Link to="/login" className={authLink}>Entrar</Link></>}
    >
      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <Label htmlFor="fullName" className={authLabel}>Nome completo</Label>
          <Input id="fullName" className={authField} value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" placeholder="Seu nome" />
        </div>
        <div>
          <Label htmlFor="email" className={authLabel}>E-mail</Label>
          <Input id="email" type="email" className={authField} value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="seu@email.com" />
        </div>
        <div>
          <Label htmlFor="password" className={authLabel}>Senha</Label>
          <Input id="password" type="password" className={authField} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" aria-describedby="senha-dica" />
          <p id="senha-dica" className="mt-1.5 px-4 text-sm text-muted-foreground">Pelo menos 6 caracteres.</p>
        </div>
        <button type="submit" className={authButton} disabled={loading}>
          {loading ? "Criando..." : "Criar conta"}
        </button>
      </form>
    </AuthShell>
  );
}
