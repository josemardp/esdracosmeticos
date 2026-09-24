import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { AuthShell, authButton, authErrorMessage, authField, authLabel, authLink } from "@/components/store/AuthShell";

// Sem link válido em alguns segundos, a página deixa de esperar e oferece pedir outro link.
const LINK_TIMEOUT_MS = 6000;

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [expired, setExpired] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setReady(true);
    } else {
      // Also listen for PASSWORD_RECOVERY event
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") {
          setReady(true);
        }
      });
      const timer = window.setTimeout(() => setExpired(true), LINK_TIMEOUT_MS);
      return () => { subscription.unsubscribe(); window.clearTimeout(timer); };
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Senha muito curta", description: "Use no mínimo 6 caracteres.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: "Não foi possível salvar a senha", description: authErrorMessage(error.message), variant: "destructive" });
    } else {
      toast({ title: "Senha alterada", description: "Sua nova senha foi salva. Já pode entrar com ela." });
      navigate("/login");
    }
  };

  if (!ready) {
    return expired ? (
      <AuthShell
        title="Link vencido ou inválido"
        subtitle="Este link para criar senha nova não funciona mais. Peça outro e use o mais recente que chegar no seu e-mail."
        footer={<Link to="/login" className={authLink}>Voltar para o login</Link>}
      >
        <Link to="/recuperar-senha" className={authButton}>Pedir outro link</Link>
      </AuthShell>
    ) : (
      <AuthShell title="Nova senha" subtitle="Conferindo o seu link...">
        <div className="h-12" aria-hidden />
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Nova senha" subtitle="Escolha a senha que você vai usar para entrar.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="password" className={authLabel}>Nova senha</Label>
          <Input id="password" type="password" className={authField} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" aria-describedby="senha-dica" />
          <p id="senha-dica" className="mt-1.5 px-4 text-sm text-muted-foreground">Pelo menos 6 caracteres.</p>
        </div>
        <button type="submit" className={authButton} disabled={loading}>
          {loading ? "Salvando..." : "Salvar nova senha"}
        </button>
      </form>
    </AuthShell>
  );
}
