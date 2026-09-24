import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) { setFullName(data.full_name || ""); setPhone(data.phone || ""); }
      setLoading(false);
    });
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName, phone }).eq("id", user!.id);
    setSaving(false);
    if (error) toast({ title: "Não foi possível salvar", description: "Tente de novo em instantes.", variant: "destructive" });
    else toast({ title: "Dados salvos" });
  };

  if (loading) return <div className="h-40 animate-pulse rounded-2xl bg-secondary" />;

  const field = "h-12 rounded-full px-4 text-base";
  const label = "mb-1.5 block text-[15px] font-medium text-foreground";

  return (
    <div>
      <h2 className="mb-4 font-display text-[26px] leading-tight text-foreground display-md">Meus dados</h2>
      <form onSubmit={handleSave} className="max-w-lg space-y-4">
        <div>
          <Label htmlFor="dados-email" className={label}>E-mail</Label>
          <Input id="dados-email" value={user?.email || ""} disabled className={`${field} bg-secondary`} aria-describedby="dados-email-dica" />
          <p id="dados-email-dica" className="mt-1.5 px-4 text-sm text-muted-foreground">O e-mail da conta não pode ser trocado aqui.</p>
        </div>
        <div>
          <Label htmlFor="dados-nome" className={label}>Nome completo</Label>
          <Input id="dados-nome" className={field} value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" placeholder="Seu nome" />
        </div>
        <div>
          <Label htmlFor="dados-tel" className={label}>Telefone</Label>
          <Input id="dados-tel" className={field} type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(18) 99999-9999" />
        </div>
        <button type="submit" disabled={saving} className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-7 text-[15px] font-medium text-primary-foreground transition-colors hover:bg-primary-deep disabled:opacity-60">
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>
    </div>
  );
}
