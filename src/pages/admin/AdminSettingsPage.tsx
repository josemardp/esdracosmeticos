import { Settings, Globe, Bell, Palette } from "lucide-react";

const sections = [
  { icon: Globe, title: "Domínio e SEO", desc: "Configure domínio próprio, título, meta tags e analytics." },
  { icon: Bell, title: "Notificações", desc: "Configure alertas de pedidos, estoque baixo e suporte." },
  { icon: Palette, title: "Aparência", desc: "Personalize cores, logo e banners da loja." },
];

export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="font-display text-2xl lg:text-3xl text-foreground mb-6">Configurações</h1>
      <div className="space-y-4">
        {sections.map(s => (
          <div key={s.title} className="bg-card border rounded-xl p-6 flex items-start gap-4">
            <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center shrink-0">
              <s.icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-body text-sm font-semibold text-foreground">{s.title}</h3>
              <p className="font-body text-xs text-muted-foreground mt-1">{s.desc}</p>
              <span className="inline-block mt-2 font-body text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">Em breve</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 bg-card border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-5 h-5 text-primary" />
          <h3 className="font-body text-sm font-semibold text-foreground">Informações do Sistema</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-body text-sm">
          <div><span className="text-muted-foreground">Plataforma:</span> <span className="text-foreground">Esdra Cosméticos v1.0</span></div>
          <div><span className="text-muted-foreground">Backend:</span> <span className="text-foreground">Lovable Cloud</span></div>
          <div><span className="text-muted-foreground">Armazenamento:</span> <span className="text-foreground">Ativo</span></div>
          <div><span className="text-muted-foreground">Autenticação:</span> <span className="text-foreground">Ativa</span></div>
        </div>
      </div>
    </div>
  );
}
