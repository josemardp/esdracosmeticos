import { Link2, ShoppingBag, MessageCircle, BarChart3, Truck } from "lucide-react";

const integrations = [
  { name: "Mercado Livre", desc: "Sincronizar produtos e pedidos com o Mercado Livre", icon: ShoppingBag, status: "Planejado" },
  { name: "Shopee", desc: "Integração com marketplace Shopee", icon: ShoppingBag, status: "Planejado" },
  { name: "WhatsApp Business API", desc: "Automação de mensagens e atendimento", icon: MessageCircle, status: "Planejado" },
  { name: "Google Analytics 4", desc: "Rastreamento avançado de conversões", icon: BarChart3, status: "Planejado" },
  { name: "Correios / Transportadoras", desc: "Cálculo de frete e rastreamento", icon: Truck, status: "Planejado" },
];

export default function IntegracoesAvancadasPage() {
  return (
    <div>
      <h1 className="font-display text-2xl lg:text-3xl text-foreground mb-2">Integrações Avançadas</h1>
      <p className="font-body text-sm text-muted-foreground mb-6">
        Integrações futuras para escalar a operação. Nenhuma integração pesada foi aberta — apenas a base está preparada.
      </p>

      <div className="space-y-3">
        {integrations.map(i => (
          <div key={i.name} className="bg-card border rounded-xl p-4 flex items-center justify-between opacity-60">
            <div className="flex items-center gap-3">
              <i.icon className="w-5 h-5 text-muted-foreground" />
              <div>
                <h3 className="font-body text-sm font-medium text-foreground">{i.name}</h3>
                <p className="font-body text-xs text-muted-foreground">{i.desc}</p>
              </div>
            </div>
            <span className="font-body text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">{i.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
