import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import logoEsdra from "@/assets/logo-esdra.png";

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
      toast({ title: "Erro ao criar conta", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Conta criada!", description: "Verifique seu e-mail para confirmar o cadastro." });
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary px-4">
      <div className="w-full max-w-md bg-card border rounded-xl p-8 shadow-elegant">
        <div className="text-center mb-8">
          <Link to="/">
            <img src={logoEsdra} alt="Esdra Cosméticos" className="h-12 mx-auto mb-4" />
          </Link>
          <h1 className="font-display text-2xl text-foreground">Criar sua conta</h1>
          <p className="font-body text-sm text-muted-foreground mt-1">
            Junte-se à Esdra Cosméticos
          </p>
        </div>
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <Label htmlFor="fullName" className="font-body text-sm">Nome completo</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Seu nome" />
          </div>
          <div>
            <Label htmlFor="email" className="font-body text-sm">E-mail</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="seu@email.com" />
          </div>
          <div>
            <Label htmlFor="password" className="font-body text-sm">Senha</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Mínimo 6 caracteres" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Criando..." : "Criar conta"}
          </Button>
        </form>
        <p className="text-center font-body text-sm text-muted-foreground mt-6">
          Já tem conta?{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
