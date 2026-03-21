import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";

export default function TermosDeUsoPage() {
  useSEO("Termos de Uso", "Termos e condições de uso da loja Esdra Cosméticos.");
  return (
    <div className="container mx-auto px-4 py-10 lg:py-16 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-6 h-6 text-primary" />
          <h1 className="font-display text-3xl lg:text-4xl text-foreground">Termos de Uso</h1>
        </div>
        <p className="font-body text-xs text-muted-foreground mb-8">Última atualização: março de 2026</p>

        <div className="font-body text-foreground/90 leading-relaxed space-y-6">
          <section>
            <h2 className="font-display text-xl text-foreground mt-8 mb-3">1. Aceitação dos Termos</h2>
            <p className="text-sm text-muted-foreground">Ao acessar e utilizar o site esdracosmeticos.com.br, você concorda com estes Termos de Uso. Se não concordar com alguma condição, por favor, não utilize nosso site.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground mt-8 mb-3">2. Sobre a Esdra Cosméticos</h2>
            <p className="text-sm text-muted-foreground">A Esdra Cosméticos é uma loja virtual de produtos de beleza e cosméticos, inscrita no CNPJ 26.744.223/0001-57, que comercializa produtos originais de marcas como Eudora, O Boticário e suas submarcas.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground mt-8 mb-3">3. Produtos e Preços</h2>
            <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
              <li>Todos os produtos comercializados são <strong className="text-foreground">100% originais</strong></li>
              <li>Os preços estão em Reais (R$) e podem ser alterados sem aviso prévio</li>
              <li>A disponibilidade dos produtos está sujeita ao estoque</li>
              <li>As imagens dos produtos são meramente ilustrativas</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground mt-8 mb-3">4. Cadastro</h2>
            <p className="text-sm text-muted-foreground">Para realizar compras, você deverá fornecer informações verdadeiras, completas e atualizadas. O uso de dados falsos pode resultar no cancelamento do pedido. Você é responsável por manter a confidencialidade de sua senha.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground mt-8 mb-3">5. Pagamento</h2>
            <p className="text-sm text-muted-foreground">Aceitamos pagamento via PIX, cartão de crédito (até 3x sem juros) e boleto bancário. O pedido só será processado após a confirmação do pagamento.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground mt-8 mb-3">6. Entrega</h2>
            <p className="text-sm text-muted-foreground">Os prazos de entrega variam de acordo com a região e são calculados a partir da confirmação do pagamento. Pedidos acima de R$ 199 possuem frete grátis para todo o Brasil.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground mt-8 mb-3">7. Trocas e Devoluções</h2>
            <p className="text-sm text-muted-foreground">Consulte nossa <Link to="/trocas-e-devolucoes" className="text-primary hover:underline">Política de Trocas e Devoluções</Link> para informações detalhadas.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground mt-8 mb-3">8. Propriedade Intelectual</h2>
            <p className="text-sm text-muted-foreground">Todo o conteúdo do site, incluindo textos, imagens, logotipos e design, é de propriedade da Esdra Cosméticos ou de seus licenciadores. É proibida a reprodução sem autorização prévia.</p>
          </section>

          <section>
            <h2 className="font-display text-xl text-foreground mt-8 mb-3">9. Contato</h2>
            <p className="text-sm text-muted-foreground">Para dúvidas sobre estes termos, entre em contato pelo e-mail esdraaline@gmail.com ou WhatsApp (18) 99145-9429.</p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t">
          <Link to="/suporte" className="font-body text-sm text-primary hover:underline">← Voltar ao Suporte</Link>
        </div>
      </motion.div>
    </div>
  );
}
