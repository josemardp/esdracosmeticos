import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { AuthShell, authButton, authErrorMessage, authField, authLabel, authLink } from "@/components/store/AuthShell";

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
      toast({ title: "Não foi possível enviar o link", description: authErrorMessage(error.message), variant: "destructive" });
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <AuthShell
        title="Confira seu e-mail"
        subtitle={<>Enviamos um link para criar uma senha nova para <strong className="font-semibold text-foreground">{email}</strong>. Se não aparecer em alguns minutos, olhe também a caixa de spam.</>}
        footer={<Link to="/login" className={authLink}>Voltar para o login</Link>}
      >
        <button type="button" onClick={() => setSent(false)} className="inline-flex h-12 w-full items-center justify-center rounded-full text-[15px] font-medium text-foreground shadow-[inset_0_0_0_1.5px_hsl(var(--foreground))]">
          Usar outro e-mail
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Recuperar senha"
      subtitle="Informe o e-mail da sua conta. Vamos mandar um link para você criar uma senha nova."
      footer={<>Lembrou a senha? <Link to="/login" className={authLink}>Entrar</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email" className={authLabel}>E-mail</Label>
          <Input id="email" type="email" className={authField} value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="seu@email.com" />
        </div>
        <button type="submit" className={authButton} disabled={loading}>
          {loading ? "Enviando..." : "Enviar link"}
        </button>
      </form>
    </AuthShell>
  );
}
