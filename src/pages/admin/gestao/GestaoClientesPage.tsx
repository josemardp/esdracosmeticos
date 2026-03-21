import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Users, Search } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  order_count: number | null;
  total_spent: number | null;
  last_order_at: string | null;
}

export default function GestaoClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("customers")
        .select("id, name, email, phone, order_count, total_spent, last_order_at")
        .order("name")
        .limit(200);
      if (data) setCustomers(data);
      setLoading(false);
    })();
  }, []);

  const filtered = search.trim()
    ? customers.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()))
    : customers;

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground mb-4">Clientes</h1>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar por nome ou e-mail..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-card border rounded-lg animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <div key={c.id} className="bg-card border rounded-lg p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-body text-sm font-semibold text-foreground truncate">{c.name}</p>
                <p className="font-body text-xs text-muted-foreground truncate">{c.email}</p>
                {c.phone && <p className="font-body text-[10px] text-muted-foreground">{c.phone}</p>}
              </div>
              <div className="text-right shrink-0">
                <p className="font-body text-sm font-bold text-foreground">R$ {(c.total_spent || 0).toFixed(2)}</p>
                <p className="font-body text-[10px] text-muted-foreground">{c.order_count || 0} pedidos</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
