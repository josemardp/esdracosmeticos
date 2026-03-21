import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { RotateCcw, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/use-seo";

export default function TrocasDevolucoesPage() {
  useSEO("Trocas e Devoluções", "Política de trocas e devoluções da Esdra Cosméticos. Troque em até 30 dias de forma simples e sem burocracia.");
  return (
    <div className="container mx-auto px-4 py-10 lg:py-16 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center gap-3 mb-6">
          <RotateCcw className="w-6 h-6 text-primary" />
          <h1 className="font-display text-3xl lg:text-4xl text-foreground">Trocas e Devoluções</h1>
        </div>

        <div className="bg-primary/5 border border-primary/15 rounded-xl p-5 mb-8">
          <p className="font-body text-sm text-foreground font-medium mb-1">Sua satisfação é nossa prioridade</p>
          <p className="font-body text-sm text-muted-foreground">Se não ficou satisfeita com sua compra, estamos aqui para ajudar. Você tem até 30 dias para solicitar troca ou devolução.</p>
        </div>

        <div className="font-body text-foreground/90 leading-relaxed space-y-6">
          <section>
            <h2 className="font-display text-xl text-foreground mt-8 mb-3">Prazo para troca ou devolução</h2>
            <p className="text-sm text-muted-foreground">Você tem até <strong className="text-foreground">30 dias corridos</strong> após o recebimento do produto para solicitar troca ou devolução, conforme o Código de Defesa do Consumidor.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground mt-8 mb-3">Condições para troca ou devolução</h2>
            <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
              <li>O produto deve estar <strong className="text-foreground">lacrado e na embalagem original</strong>, sem sinais de uso</li>
              <li>Deve acompanhar todos os acessórios e brindes enviados</li>
              <li>O comprovante de compra (e-mail de confirmação) deve ser apresentado</li>
              <li>Produtos com defeito de fabricação podem ser trocados mesmo se abertos</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground mt-8 mb-3">Como solicitar</h2>
            <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground">
              <li>Entre em contato pelo WhatsApp <strong className="text-foreground">(18) 99145-9429</strong> ou pelo e-mail <strong className="text-foreground">esdraaline@gmail.com</strong></li>
              <li>Informe o número do pedido e o motivo da troca ou devolução</li>
              <li>Aguarde as instruções para envio do produto</li>
              <li>Após receber e aprovar o produto devolvido, processaremos a troca ou reembolso em até 7 dias úteis</li>
            </ol>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground mt-8 mb-3">Custos de envio</h2>
            <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
              <li><strong className="text-foreground">Defeito de fabricação:</strong> frete de devolução por nossa conta</li>
              <li><strong className="text-foreground">Arrependimento / troca por preferência:</strong> frete de devolução por conta do cliente</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground mt-8 mb-3">Reembolso</h2>
            <p className="text-sm text-muted-foreground">O reembolso será feito pela mesma forma de pagamento utilizada na compra, em até 7 dias úteis após a aprovação da devolução. Em compras parceladas no cartão, o estorno seguirá a política da administradora do cartão.</p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <Link to="/suporte" className="font-body text-sm text-primary hover:underline">← Voltar ao Suporte</Link>
          <a href="https://wa.me/5518991459429?text=Olá,%20gostaria%20de%20solicitar%20uma%20troca%20ou%20devolução." target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm"><MessageCircle className="w-4 h-4 mr-1.5" /> Solicitar pelo WhatsApp</Button>
          </a>
        </div>
      </motion.div>
    </div>
  );
}
