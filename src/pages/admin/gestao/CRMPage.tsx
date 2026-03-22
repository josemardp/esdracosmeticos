import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Search, MessageSquare, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Customer {
  id: string; name: string; email: string; phone: string | null;
  order_count: number | null; total_spent: number | null;
  last_order_at: string | null; created_at: string;
}

interface Note { id: string; note: string; created_at: string; }

export default function CRMPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("customers")
        .select("id, name, email, phone, order_count, total_spent, last_order_at, created_at")
        .order("total_spent", { ascending: false })
        .limit(500);
      setCustomers((data as Customer[]) || []);
      setLoading(false);
    })();
  }, []);

  const openCustomer = async (c: Customer) => {
    setSelected(c);
    const { data } = await supabase
      .from("customer_notes" as any)
      .select("id, note, created_at")
      .eq("customer_id", c.id)
      .order("created_at", { ascending: false });
    setNotes((data as any[]) || []);
    setNewNote("");
  };

  const addNote = async () => {
    if (!newNote.trim() || !selected || !user) return;
    setSavingNote(true);
    const { error } = await (supabase.from("customer_notes" as any) as any).insert({
      customer_id: selected.id,
      note: newNote.trim(),
      created_by: user.id,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Nota adicionada ✓" });
      openCustomer(selected);
    }
    setSavingNote(false);
  };

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const filtered = customers.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone?.includes(q);
  });

  const daysSince = (d: string | null) => {
    if (!d) return null;
    return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  };

  return (
    <div>
      <h1 className="font-display text-2xl lg:text-3xl text-foreground mb-4">CRM — Clientes</h1>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome, email ou telefone..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-card border rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => {
            const days = daysSince(c.last_order_at);
            return (
              <div key={c.id} className="bg-card border rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => openCustomer(c)}>
                <div>
                  <h3 className="font-body text-sm font-medium text-foreground">{c.name}</h3>
                  <p className="font-body text-xs text-muted-foreground">
                    {c.email} {c.phone && `· ${c.phone}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-body text-sm font-semibold text-foreground">{fmt(c.total_spent || 0)}</p>
                  <p className="font-body text-xs text-muted-foreground">
                    {c.order_count || 0} pedido(s) {days !== null && `· ${days}d atrás`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{selected?.name}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm font-body">
                <div><span className="text-muted-foreground">Email:</span> {selected.email}</div>
                <div><span className="text-muted-foreground">Telefone:</span> {selected.phone || "—"}</div>
                <div><span className="text-muted-foreground">Pedidos:</span> {selected.order_count || 0}</div>
                <div><span className="text-muted-foreground">Total:</span> {fmt(selected.total_spent || 0)}</div>
                <div><span className="text-muted-foreground">Cliente desde:</span> {new Date(selected.created_at).toLocaleDateString("pt-BR")}</div>
                <div><span className="text-muted-foreground">Última compra:</span> {selected.last_order_at ? new Date(selected.last_order_at).toLocaleDateString("pt-BR") : "—"}</div>
              </div>

              <div>
                <h4 className="font-body text-sm font-semibold text-foreground mb-2 flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" /> Observações
                </h4>
                <div className="flex gap-2 mb-2">
                  <Textarea placeholder="Adicionar observação..." value={newNote} onChange={e => setNewNote(e.target.value)} className="text-sm" rows={2} />
                  <Button size="sm" onClick={addNote} disabled={savingNote || !newNote.trim()} className="shrink-0">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                {notes.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {notes.map(n => (
                      <div key={n.id} className="bg-secondary rounded-lg p-2">
                        <p className="font-body text-xs text-foreground">{n.note}</p>
                        <p className="font-body text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString("pt-BR")}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
