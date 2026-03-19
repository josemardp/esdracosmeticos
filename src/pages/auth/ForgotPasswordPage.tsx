import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import logoEsdra from "@/assets/logo-esdra.png";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary px-4">
      <div className="w-full max-w-md bg-card border rounded-xl p-8 shadow-elegant">
        <div className="text-center mb-8">
          <Link to="/">
            <img src={logoEsdra} alt="Esdra Cosméticos" className="h-12 mx-auto mb-4 logo-enhance" />
          </Link>
          <h1 className="font-display text-2xl text-foreground">Recuperar senha</h1>
        </div>
        {sent ? (
          <div className="text-center">
            <p className="font-body text-sm text-foreground mb-4">
              Enviamos um link de recuperação para <strong>{email}</strong>.
            </p>
            <p className="font-body text-xs text-muted-foreground">
              Verifique sua caixa de entrada e spam.
            </p>
            <Link to="/login">
              <Button variant="outline" className="mt-6">Voltar ao login</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="font-body text-sm">E-mail cadastrado</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="seu@email.com" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Enviando..." : "Enviar link de recuperação"}
            </Button>
            <p className="text-center">
              <Link to="/login" className="font-body text-xs text-primary hover:underline">
                Voltar ao login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
