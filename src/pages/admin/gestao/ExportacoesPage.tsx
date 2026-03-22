import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const downloadCSV = (filename: string, headers: string[], rows: string[][]) => {
  const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${(c || "").replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

const exports = [
  {
    label: "Clientes", desc: "Nome, email, telefone, pedidos, total gasto",
    fn: async () => {
      const { data } = await supabase.from("customers").select("name, email, phone, order_count, total_spent, last_order_at, created_at").order("name");
      downloadCSV("clientes.csv", ["Nome", "Email", "Telefone", "Pedidos", "Total Gasto", "Última Compra", "Cadastro"],
        (data || []).map((c: any) => [c.name, c.email, c.phone || "", String(c.order_count || 0), String(c.total_spent || 0),
          c.last_order_at ? new Date(c.last_order_at).toLocaleDateString("pt-BR") : "", new Date(c.created_at).toLocaleDateString("pt-BR")]));
      return (data || []).length;
    },
  },
  {
    label: "Produtos", desc: "Nome, SKU, preço, custo, estoque, margem",
    fn: async () => {
      const { data } = await supabase.from("products").select("name, sku, price, sale_price, cost, avg_cost, inventory_count, active").order("name");
      downloadCSV("produtos.csv", ["Nome", "SKU", "Preço", "Promoção", "Custo", "Custo Médio", "Estoque", "Ativo"],
        (data || []).map((p: any) => [p.name, p.sku || "", String(p.price), String(p.sale_price || ""), String(p.cost || 0),
          String((p as any).avg_cost || 0), String(p.inventory_count), p.active ? "Sim" : "Não"]));
      return (data || []).length;
    },
  },
  {
    label: "Vendas", desc: "Código, cliente, total, data, canal",
    fn: async () => {
      const { data } = await supabase.from("sales").select("sale_code, customer_name, total, discount, sale_date, channel_id").order("sale_date", { ascending: false }).limit(1000);
      downloadCSV("vendas.csv", ["Código", "Cliente", "Total", "Desconto", "Data"],
        (data || []).map((s: any) => [s.sale_code, s.customer_name, String(s.total), String(s.discount), new Date(s.sale_date).toLocaleDateString("pt-BR")]));
      return (data || []).length;
    },
  },
  {
    label: "Movimentações de Caixa", desc: "Data, tipo, valor, descrição",
    fn: async () => {
      const { data } = await supabase.from("cash_movements").select("movement_date, type, amount, description").order("movement_date", { ascending: false }).limit(1000);
      downloadCSV("caixa.csv", ["Data", "Tipo", "Valor", "Descrição"],
        (data || []).map((m: any) => [new Date(m.movement_date).toLocaleDateString("pt-BR"), m.type === "credit" ? "Entrada" : "Saída", String(m.amount), m.description]));
      return (data || []).length;
    },
  },
  {
    label: "Pedidos (E-commerce)", desc: "Código, cliente, total, status, data",
    fn: async () => {
      const { data } = await supabase.from("orders").select("order_code, total, status, payment_method, created_at, customer_id").order("created_at", { ascending: false }).limit(1000);
      downloadCSV("pedidos.csv", ["Código", "Total", "Status", "Pagamento", "Data"],
        (data || []).map((o: any) => [o.order_code, String(o.total), o.status, o.payment_method || "", new Date(o.created_at).toLocaleDateString("pt-BR")]));
      return (data || []).length;
    },
  },
];

export default function ExportacoesPage() {
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (e: typeof exports[0]) => {
    setExporting(e.label);
    try {
      const count = await e.fn();
      toast({ title: `${e.label} exportados ✓`, description: `${count} registros` });
    } catch (err: any) {
      toast({ title: "Erro na exportação", description: err.message, variant: "destructive" });
    }
    setExporting(null);
  };

  return (
    <div>
      <h1 className="font-display text-2xl lg:text-3xl text-foreground mb-2">Exportações</h1>
      <p className="font-body text-sm text-muted-foreground mb-6">Exporte dados em CSV para análise externa.</p>

      <div className="space-y-3">
        {exports.map(e => (
          <div key={e.label} className="bg-card border rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-primary shrink-0" />
              <div>
                <h3 className="font-body text-sm font-medium text-foreground">{e.label}</h3>
                <p className="font-body text-xs text-muted-foreground">{e.desc}</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => handleExport(e)} disabled={exporting === e.label}>
              {exporting === e.label ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
              CSV
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
