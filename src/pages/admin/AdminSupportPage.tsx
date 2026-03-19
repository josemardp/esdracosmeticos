import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Mail, Phone } from "lucide-react";

interface Ticket {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  channel: string;
  status: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  new: "bg-info/10 text-info border-info/20",
  in_progress: "bg-warning/10 text-warning border-warning/20",
  resolved: "bg-success/10 text-success border-success/20",
};

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setTickets((data as Ticket[]) ?? []);
        setLoading(false);
      });
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("support_tickets").update({ status }).eq("id", id);
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  return (
    <div>
      <h1 className="font-display text-2xl lg:text-3xl text-foreground mb-6">Suporte</h1>
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="bg-card border rounded-xl p-6 animate-pulse h-28" />)}
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <MessageCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-sm text-muted-foreground">Nenhum ticket de suporte recebido.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <div key={t.id} className="bg-card border rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-body text-sm font-semibold text-foreground">{t.subject}</h3>
                  <p className="font-body text-xs text-muted-foreground mt-0.5">{t.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={t.status}
                    onChange={(e) => updateStatus(t.id, e.target.value)}
                    className="font-body text-xs border rounded px-2 py-1 bg-background text-foreground"
                  >
                    <option value="new">Novo</option>
                    <option value="in_progress">Em andamento</option>
                    <option value="resolved">Resolvido</option>
                  </select>
                  <Badge variant="outline" className={statusColors[t.status] || ""}>
                    {t.status === "new" ? "Novo" : t.status === "in_progress" ? "Em andamento" : "Resolvido"}
                  </Badge>
                </div>
              </div>
              <p className="font-body text-sm text-foreground mb-3 whitespace-pre-wrap">{t.message}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground font-body">
                <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{t.email}</span>
                {t.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{t.phone}</span>}
                <span>{new Date(t.created_at).toLocaleDateString("pt-BR")}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
