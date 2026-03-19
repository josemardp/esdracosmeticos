import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
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
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else toast({ title: "Dados salvos!" });
  };

  if (loading) return <div className="animate-pulse h-40 bg-secondary rounded-xl" />;

  return (
    <div>
      <h2 className="font-display text-xl text-foreground mb-6">Meus Dados</h2>
      <form onSubmit={handleSave} className="bg-card border rounded-xl p-6 space-y-4 max-w-lg">
        <div>
          <Label className="font-body text-sm">E-mail</Label>
          <Input value={user?.email || ""} disabled className="bg-muted" />
        </div>
        <div>
          <Label className="font-body text-sm">Nome completo</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome" />
        </div>
        <div>
          <Label className="font-body text-sm">Telefone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(18) 99999-9999" />
        </div>
        <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar alterações"}</Button>
      </form>
    </div>
  );
}
