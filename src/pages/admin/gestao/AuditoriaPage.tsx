import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface AuditEntry { id: string; entity: string; entity_id: string | null; action: string; details: any; user_id: string; created_at: string; }

export default function AuditoriaPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("audit_log" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      setEntries((data as any[]) || []);
      setLoading(false);
    })();
  }, []);

  const filtered = entries.filter(e => {
    if (!search) return true;
    const q = search.toLowerCase();
    return e.entity.toLowerCase().includes(q) || e.action.toLowerCase().includes(q) || e.entity_id?.toLowerCase().includes(q);
  });

  const actionColor: Record<string, string> = {
    create: "bg-emerald-100 text-emerald-700",
    update: "bg-blue-100 text-blue-700",
    delete: "bg-red-100 text-red-700",
  };

  return (
    <div>
      <h1 className="font-display text-2xl lg:text-3xl text-foreground mb-2">Auditoria</h1>
      <p className="font-body text-sm text-muted-foreground mb-4">Histórico de alterações críticas no sistema.</p>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por entidade ou ação..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-card border rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <Shield className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-sm text-muted-foreground">Nenhum registro de auditoria encontrado.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(e => (
            <div key={e.id} className="bg-card border rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded-full font-body text-[10px] font-semibold ${actionColor[e.action] || "bg-secondary text-foreground"}`}>
                  {e.action}
                </span>
                <div>
                  <p className="font-body text-sm text-foreground">{e.entity} {e.entity_id && <span className="text-muted-foreground">#{e.entity_id.slice(0, 8)}</span>}</p>
                  {e.details && <p className="font-body text-[10px] text-muted-foreground truncate max-w-xs">{JSON.stringify(e.details)}</p>}
                </div>
              </div>
              <p className="font-body text-xs text-muted-foreground shrink-0">{new Date(e.created_at).toLocaleString("pt-BR")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
