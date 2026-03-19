import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users } from "lucide-react";

interface Customer { id: string; name: string; email: string; phone: string | null; created_at: string; }

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("customers").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setCustomers((data as Customer[]) ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl lg:text-3xl text-foreground mb-6">Clientes</h1>
      {loading ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-card border rounded-xl animate-pulse" />)}</div> : customers.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-body text-sm text-muted-foreground">Nenhum cliente cadastrado.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {customers.map(c => (
            <div key={c.id} className="bg-card border rounded-xl p-4 flex items-center justify-between">
              <div>
                <h3 className="font-body text-sm font-medium text-foreground">{c.name}</h3>
                <p className="font-body text-xs text-muted-foreground">{c.email} {c.phone && `· ${c.phone}`}</p>
              </div>
              <p className="font-body text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("pt-BR")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
