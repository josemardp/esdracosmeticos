import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserMinus, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Customer {
  id: string; name: string; email: string; phone: string | null;
  order_count: number | null; total_spent: number | null;
  last_order_at: string | null;
}

export default function ReativacaoPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const load = async () => {
    setLoading(true);
    const cutoff = new Date(Date.now() - days * 86400000).toISOString();
    const { data } = await supabase
      .from("customers")
      .select("id, name, email, phone, order_count, total_spent, last_order_at")
      .lt("last_order_at", cutoff)
      .order("last_order_at", { ascending: true })
      .limit(200);
    setCustomers((data as Customer[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [days]);

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const daysSince = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000);

  return (
    <div>
      <h1 className="font-display text-2xl lg:text-3xl text-foreground mb-2">Reativação de Clientes</h1>
      <p className="font-body text-sm text-muted-foreground mb-4">Clientes inativos que podem ser reativados.</p>

      <div className="flex gap-2 mb-4">
        {[30, 60, 90, 180].map(d => (
          <Button key={d} variant={days === d ? "default" : "outline"} size="sm" onClick={() => setDays(d)}>
            {d}+ dias
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-card border rounded-xl animate-pulse" />)}</div>
      ) : customers.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <UserMinus className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-sm text-muted-foreground">Nenhum cliente inativo há {days}+ dias.</p>
        </div>
      ) : (
        <>
          <div className="bg-warning/10 border border-warning/20 rounded-xl p-3 mb-4">
            <p className="font-body text-sm text-warning font-medium">{customers.length} cliente(s) inativo(s) há {days}+ dias</p>
          </div>
          <div className="space-y-2">
            {customers.map(c => (
              <div key={c.id} className="bg-card border rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-body text-sm font-medium text-foreground">{c.name}</h3>
                  <p className="font-body text-xs text-muted-foreground">
                    {c.email} · {c.order_count || 0} pedido(s) · {fmt(c.total_spent || 0)}
                  </p>
                  <p className="font-body text-xs text-destructive">
                    Última compra: {c.last_order_at ? `${daysSince(c.last_order_at)} dias atrás` : "nunca"}
                  </p>
                </div>
                <div className="flex gap-1">
                  {c.phone && (
                    <a href={`https://wa.me/55${c.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm"><Phone className="w-4 h-4" /></Button>
                    </a>
                  )}
                  <a href={`mailto:${c.email}`}>
                    <Button variant="ghost" size="sm"><Mail className="w-4 h-4" /></Button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
