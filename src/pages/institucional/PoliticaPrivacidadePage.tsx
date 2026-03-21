import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";

export default function PoliticaPrivacidadePage() {
  useSEO("Política de Privacidade", "Saiba como a Esdra Cosméticos protege seus dados pessoais e garante sua privacidade.");
  return (
    <div className="container mx-auto px-4 py-10 lg:py-16 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <h1 className="font-display text-3xl lg:text-4xl text-foreground">Política de Privacidade</h1>
        </div>
        <p className="font-body text-xs text-muted-foreground mb-8">Última atualização: março de 2026</p>

        <div className="prose prose-sm max-w-none font-body text-foreground/90 leading-relaxed space-y-6">
          <section>
            <h2 className="font-display text-xl text-foreground mt-8 mb-3">1. Informações que coletamos</h2>
            <p>A Esdra Cosméticos coleta apenas as informações necessárias para processar seus pedidos e melhorar sua experiência de compra. Isso inclui:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>Nome completo, e-mail e telefone para contato e envio de pedidos</li>
              <li>Endereço de entrega para envio dos produtos</li>
              <li>Dados de navegação anônimos para melhoria do site</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground mt-8 mb-3">2. Como usamos seus dados</h2>
            <p>Utilizamos seus dados exclusivamente para:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>Processar e entregar seus pedidos</li>
              <li>Enviar atualizações sobre o status do pedido</li>
              <li>Enviar comunicações de marketing, caso autorizado</li>
              <li>Melhorar nossos produtos e serviços</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground mt-8 mb-3">3. Compartilhamento de dados</h2>
            <p className="text-sm text-muted-foreground">Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros para fins de marketing. Seus dados podem ser compartilhados apenas com transportadoras para entrega dos pedidos e com processadores de pagamento para conclusão das transações.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground mt-8 mb-3">4. Segurança</h2>
            <p className="text-sm text-muted-foreground">Adotamos medidas de segurança para proteger seus dados pessoais contra acesso não autorizado, alteração, divulgação ou destruição. Utilizamos criptografia SSL em todas as transações.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground mt-8 mb-3">5. Seus direitos</h2>
            <p className="text-sm text-muted-foreground">Conforme a Lei Geral de Proteção de Dados (LGPD), você tem direito a acessar, corrigir, excluir ou solicitar a portabilidade dos seus dados pessoais. Para exercer esses direitos, entre em contato pelo e-mail esdraaline@gmail.com ou pelo WhatsApp (18) 99145-9429.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground mt-8 mb-3">6. Contato</h2>
            <p className="text-sm text-muted-foreground">Em caso de dúvidas sobre esta política, entre em contato:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>E-mail: esdraaline@gmail.com</li>
              <li>WhatsApp: (18) 99145-9429</li>
            </ul>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t">
          <Link to="/suporte" className="font-body text-sm text-primary hover:underline">← Voltar ao Suporte</Link>
        </div>
      </motion.div>
    </div>
  );
}
