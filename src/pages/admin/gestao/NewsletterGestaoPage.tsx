import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Download, Search, UserCheck, UserX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface Subscriber { id: string; email: string; name: string | null; active: boolean; source: string; created_at: string; }

export default function NewsletterGestaoPage() {
  const [subs, setSubs] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("newsletter_subscribers").select("*").order("created_at", { ascending: false }).limit(500);
    setSubs((data as Subscriber[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggle = async (id: string, active: boolean) => {
    await supabase.from("newsletter_subscribers").update({ active: !active }).eq("id", id);
    toast({ title: active ? "Desativado" : "Reativado" });
    load();
  };

  const exportCSV = () => {
    const active = subs.filter(s => s.active);
    const csv = "Nome,Email,Origem,Data\n" + active.map(s =>
      `"${s.name || ""}","${s.email}","${s.source}","${new Date(s.created_at).toLocaleDateString("pt-BR")}"`
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "newsletter.csv"; a.click();
    URL.revokeObjectURL(url);
    toast({ title: `${active.length} emails exportados ✓` });
  };

  const filtered = subs.filter(s => !search || s.email.toLowerCase().includes(search.toLowerCase()) || s.name?.toLowerCase().includes(search.toLowerCase()));
  const activeCount = subs.filter(s => s.active).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="font-display text-2xl lg:text-3xl text-foreground">Newsletter</h1>
        <Button size="sm" variant="outline" onClick={exportCSV}><Download className="w-4 h-4 mr-1" /> Exportar CSV</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-card border rounded-xl p-3 text-center">
          <p className="font-body text-2xl font-bold text-foreground">{activeCount}</p>
          <p className="font-body text-xs text-muted-foreground">Ativos</p>
        </div>
        <div className="bg-card border rounded-xl p-3 text-center">
          <p className="font-body text-2xl font-bold text-foreground">{subs.length - activeCount}</p>
          <p className="font-body text-xs text-muted-foreground">Inativos</p>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por email ou nome..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-card border rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(s => (
            <div key={s.id} className="bg-card border rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {s.active ? <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" /> : <UserX className="w-4 h-4 text-muted-foreground shrink-0" />}
                <div>
                  <p className="font-body text-sm text-foreground">{s.email}</p>
                  <p className="font-body text-[10px] text-muted-foreground">{s.name || "—"} · {s.source} · {new Date(s.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => toggle(s.id, s.active)}>
                {s.active ? "Desativar" : "Reativar"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
