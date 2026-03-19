import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link2, RefreshCw, AlertCircle, CheckCircle2, XCircle } from "lucide-react";

interface MarketplaceConfig {
  id: string; channel: string; active: boolean; environment: string;
  connection_status: string; last_sync_at: string | null;
}

interface IntegrationLog {
  id: string; channel: string; event_type: string; entity: string;
  status: string; message: string | null; created_at: string;
}

const channelLogos: Record<string, string> = {
  mercadolivre: "Mercado Livre",
  amazon: "Amazon",
  magalu: "Magalu",
  shopee: "Shopee",
};

const statusIcons: Record<string, React.ReactNode> = {
  connected: <CheckCircle2 className="w-4 h-4 text-success" />,
  disconnected: <XCircle className="w-4 h-4 text-muted-foreground" />,
  error: <AlertCircle className="w-4 h-4 text-destructive" />,
};

export default function AdminIntegrationsPage() {
  const [configs, setConfigs] = useState<MarketplaceConfig[]>([]);
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: cfgs }, { data: logData }] = await Promise.all([
      supabase.from("marketplace_configs").select("*").order("channel"),
      supabase.from("integration_logs").select("*").order("created_at", { ascending: false }).limit(20),
    ]);
    setConfigs((cfgs as MarketplaceConfig[]) ?? []);
    setLogs((logData as IntegrationLog[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const seedChannels = async () => {
    const channels = ["mercadolivre", "amazon", "magalu", "shopee"];
    for (const ch of channels) {
      const exists = configs.find(c => c.channel === ch);
      if (!exists) {
        await supabase.from("marketplace_configs").insert({ channel: ch, active: false, environment: "sandbox", connection_status: "disconnected" });
      }
    }
    fetchData();
  };

  const toggleChannel = async (id: string, active: boolean) => {
    await supabase.from("marketplace_configs").update({ active: !active }).eq("id", id);
    fetchData();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl lg:text-3xl text-foreground">Integrações / Marketplaces</h1>
        <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="w-4 h-4 mr-2" /> Atualizar</Button>
      </div>

      {/* Status Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
        <p className="font-body text-sm text-foreground font-medium mb-1">📋 Status do Módulo: Preparação Estrutural</p>
        <p className="font-body text-xs text-muted-foreground">A base de dados, mapeamento de produtos e logs está pronta. A conexão real com as APIs dos marketplaces requer tokens e credenciais de cada plataforma, que serão configurados na fase de produção.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-32 bg-card border rounded-xl animate-pulse" />)}</div>
      ) : (
        <>
          {configs.length === 0 ? (
            <div className="bg-card border rounded-xl p-12 text-center mb-8">
              <Link2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-body text-sm text-muted-foreground mb-4">Nenhum canal configurado. Inicialize os canais para começar.</p>
              <Button onClick={seedChannels}>Inicializar Canais</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {configs.map(c => (
                <div key={c.id} className="bg-card border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {statusIcons[c.connection_status] || statusIcons.disconnected}
                      <h3 className="font-body text-sm font-semibold text-foreground">{channelLogos[c.channel] || c.channel}</h3>
                    </div>
                    <Badge variant="outline" className={c.active ? "bg-success/10 text-success border-success/20" : ""}>
                      {c.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <div className="space-y-1 font-body text-xs text-muted-foreground mb-3">
                    <p>Ambiente: {c.environment}</p>
                    <p>Status: {c.connection_status}</p>
                    <p>Último sync: {c.last_sync_at ? new Date(c.last_sync_at).toLocaleString("pt-BR") : "Nunca"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => toggleChannel(c.id, c.active)}>
                      {c.active ? "Desativar" : "Ativar"}
                    </Button>
                    <Button size="sm" variant="outline" disabled>Configurar API</Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Logs */}
          <div>
            <h2 className="font-display text-xl text-foreground mb-4">Logs de Integração</h2>
            {logs.length === 0 ? (
              <div className="bg-card border rounded-xl p-8 text-center">
                <p className="font-body text-sm text-muted-foreground">Nenhum log registrado.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map(l => (
                  <div key={l.id} className="bg-card border rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="font-body text-xs font-medium text-foreground">[{channelLogos[l.channel] || l.channel}] {l.event_type} · {l.entity}</p>
                      {l.message && <p className="font-body text-xs text-muted-foreground mt-0.5">{l.message}</p>}
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className={l.status === "error" ? "text-destructive" : l.status === "success" ? "text-success" : ""}>{l.status}</Badge>
                      <p className="font-body text-[10px] text-muted-foreground mt-0.5">{new Date(l.created_at).toLocaleString("pt-BR")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
