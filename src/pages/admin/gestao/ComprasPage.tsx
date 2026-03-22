import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Plus, ShoppingBag, Trash2, CalendarIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PO {
  id: string;
  po_code: string;
  subtotal: number;
  discount: number;
  freight: number;
  total: number;
  installments: number;
  status: string;
  order_date: string;
  notes: string | null;
  supplier: { name: string } | null;
}

interface Supplier { id: string; name: string; }
interface ProductOption { id: string; name: string; cost: number | null; }

interface FormItem { name: string; qty: string; unit_cost: string; product_id: string; }

const statusLabels: Record<string, string> = { draft: "Rascunho", confirmed: "Confirmado", received: "Recebido", cancelled: "Cancelado" };
const statusColors: Record<string, string> = { draft: "secondary", confirmed: "default", received: "default", cancelled: "destructive" };

export default function ComprasPage() {
  const [pos, setPos] = useState<PO[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [items, setItems] = useState<FormItem[]>([{ name: "", qty: "1", unit_cost: "", product_id: "" }]);
  const [installments, setInstallments] = useState("1");
  const [discount, setDiscount] = useState("0");
  const [freight, setFreight] = useState("0");
  const [notes, setNotes] = useState("");
  const [orderDate, setOrderDate] = useState<Date | undefined>(new Date());
  const [expectedDelivery, setExpectedDelivery] = useState<Date | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("purchase_orders")
      .select("id, po_code, subtotal, discount, freight, total, installments, status, order_date, notes, supplier:suppliers(name)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data) setPos(data as unknown as PO[]);
    setLoading(false);
  };

  const loadSuppliers = async () => {
    const { data } = await supabase.from("suppliers").select("id, name").eq("active", true).order("name");
    if (data) setSuppliers(data);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    loadSuppliers();
    supabase.from("products").select("id, name, cost").eq("active", true).order("name").then(({ data }) => {
      if (data) setProducts(data.map(p => ({ id: p.id, name: p.name, cost: p.cost })));
    });
    setSupplierId("");
    setItems([{ name: "", qty: "1", unit_cost: "", product_id: "" }]);
    setInstallments("1");
    setDiscount("0");
    setFreight("0");
    setNotes("");
    setOrderDate(new Date());
    setExpectedDelivery(undefined);
    setDialogOpen(true);
  };

  const selectProduct = (idx: number, productId: string) => {
    const prod = products.find(p => p.id === productId);
    if (prod) {
      setItems(prev => prev.map((it, i) => i === idx ? { ...it, product_id: productId, name: prod.name, unit_cost: prod.cost ? String(prod.cost) : it.unit_cost } : it));
    } else {
      setItems(prev => prev.map((it, i) => i === idx ? { ...it, product_id: "" } : it));
    }
  };

  const updateItem = (idx: number, field: keyof FormItem, value: string) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  };

  const addItem = () => setItems(prev => [...prev, { name: "", qty: "1", unit_cost: "", product_id: "" }]);
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const subtotal = items.reduce((s, it) => s + (parseInt(it.qty) || 0) * (parseFloat(it.unit_cost) || 0), 0);
  const total = subtotal - (parseFloat(discount) || 0) + (parseFloat(freight) || 0);

  const handleSave = async () => {
    if (!supplierId) { toast({ title: "Selecione um fornecedor", variant: "destructive" }); return; }
    const validItems = items.filter(it => it.name.trim() && parseFloat(it.unit_cost) > 0);
    if (validItems.length === 0) { toast({ title: "Adicione ao menos um item", variant: "destructive" }); return; }

    setSaving(true);
    const { error } = await supabase.rpc("create_purchase_order", {
      p_supplier_id: supplierId,
      p_items: validItems.map(it => ({
        name: it.name.trim(),
        qty: parseInt(it.qty) || 1,
        unit_cost: parseFloat(it.unit_cost) || 0,
        product_id: it.product_id || null,
      })),
      p_installments: parseInt(installments) || 1,
      p_discount: parseFloat(discount) || 0,
      p_freight: parseFloat(freight) || 0,
      p_notes: notes || null,
      p_order_date: orderDate ? orderDate.toISOString() : new Date().toISOString(),
      p_expected_delivery: expectedDelivery ? format(expectedDelivery, "yyyy-MM-dd") : null,
    });

    setSaving(false);
    if (error) {
      toast({ title: "Erro ao criar compra", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Compra registrada com sucesso!" });
      setDialogOpen(false);
      load();
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("purchase_orders").update({ status }).eq("id", id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="font-display text-2xl text-foreground">Compras</h1>
        <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" />Nova Compra</Button>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-card border rounded-lg animate-pulse" />)}</div>
      ) : pos.length === 0 ? (
        <p className="font-body text-sm text-muted-foreground text-center py-12">Nenhuma compra registrada.</p>
      ) : (
        <div className="space-y-2">
          {pos.map(po => (
            <div key={po.id} className="bg-card border rounded-lg p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <ShoppingBag className="w-5 h-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="font-body text-sm text-foreground font-medium">
                    {po.po_code} — {po.supplier?.name || "Sem fornecedor"}
                  </p>
                  <p className="font-body text-[10px] text-muted-foreground">
                    {new Date(po.order_date).toLocaleDateString("pt-BR")} · {po.installments}x
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-body text-sm font-bold text-foreground">R$ {po.total.toFixed(2)}</span>
                <select
                  value={po.status}
                  onChange={e => updateStatus(po.id, e.target.value)}
                  className="font-body text-[10px] border rounded px-1.5 py-0.5 bg-background text-foreground"
                >
                  {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nova Compra</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Fornecedor *</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data da Compra</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !orderDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {orderDate ? format(orderDate, "dd/MM/yyyy") : "Selecione..."}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={orderDate} onSelect={setOrderDate} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Previsão de Entrega</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !expectedDelivery && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {expectedDelivery ? format(expectedDelivery, "dd/MM/yyyy") : "Opcional"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={expectedDelivery} onSelect={setExpectedDelivery} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Itens</Label>
              {items.map((it, idx) => (
                <div key={idx} className="flex gap-2 mb-2 items-end">
                  <div className="flex-1"><Input placeholder="Descrição" value={it.name} onChange={e => updateItem(idx, "name", e.target.value)} /></div>
                  <div className="w-16"><Input placeholder="Qtd" type="number" min="1" value={it.qty} onChange={e => updateItem(idx, "qty", e.target.value)} /></div>
                  <div className="w-24"><Input placeholder="Custo" type="number" step="0.01" min="0" value={it.unit_cost} onChange={e => updateItem(idx, "unit_cost", e.target.value)} /></div>
                  {items.length > 1 && (
                    <button onClick={() => removeItem(idx)} className="p-1.5 text-destructive"><Trash2 className="w-4 h-4" /></button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addItem}><Plus className="w-3 h-3 mr-1" />Item</Button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div><Label>Parcelas</Label><Input type="number" min="1" max="24" value={installments} onChange={e => setInstallments(e.target.value)} /></div>
              <div><Label>Desconto</Label><Input type="number" step="0.01" min="0" value={discount} onChange={e => setDiscount(e.target.value)} /></div>
              <div><Label>Frete</Label><Input type="number" step="0.01" min="0" value={freight} onChange={e => setFreight(e.target.value)} /></div>
            </div>

            <div><Label>Observações</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} /></div>

            <div className="bg-secondary rounded-lg p-3 font-body text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>R$ {subtotal.toFixed(2)}</span></div>
              {parseFloat(discount) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Desconto</span><span>-R$ {(parseFloat(discount) || 0).toFixed(2)}</span></div>}
              {parseFloat(freight) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span>+R$ {(parseFloat(freight) || 0).toFixed(2)}</span></div>}
              <div className="flex justify-between font-bold border-t mt-1 pt-1"><span>Total</span><span>R$ {total.toFixed(2)}</span></div>
            </div>

            <Button className="w-full" onClick={handleSave} disabled={saving}>{saving ? "Registrando..." : "Registrar Compra"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
