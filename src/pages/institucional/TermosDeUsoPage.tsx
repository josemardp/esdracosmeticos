import { Link } from "react-router-dom";
import { InfoPage } from "@/components/store/InfoPage";
import { useSEO } from "@/hooks/use-seo";

export default function TermosDeUsoPage() {
  useSEO("Termos de Uso", "Termos e condições de uso da loja Esdra Cosméticos.");
  return (
    <InfoPage title="Termos de Uso" updated="março de 2026" whatsappMessage="Olá, tenho uma dúvida sobre os termos de uso da Esdra Cosméticos.">
      <section>
        <h2>1. Aceitação dos Termos</h2>
        <p>Ao acessar e utilizar o site esdracosmeticos.com.br, você concorda com estes Termos de Uso. Se não concordar com alguma condição, por favor, não utilize nosso site.</p>
      </section>

      <section>
        <h2>2. Sobre a Esdra Cosméticos</h2>
        <p>A Esdra Cosméticos é uma loja virtual de produtos de beleza e cosméticos, inscrita no CNPJ 26.744.223/0001-57, que comercializa produtos originais de marcas como Eudora, O Boticário e suas submarcas.</p>
      </section>

      <section>
        <h2>3. Produtos e Preços</h2>
        <ul>
          <li>Todos os produtos comercializados são <strong>100% originais</strong></li>
          <li>Os preços estão em Reais (R$) e podem ser alterados sem aviso prévio</li>
          <li>A disponibilidade dos produtos está sujeita ao estoque</li>
          <li>As imagens dos produtos são meramente ilustrativas</li>
        </ul>
      </section>

      <section>
        <h2>4. Cadastro</h2>
        <p>Para realizar compras, você deverá fornecer informações verdadeiras, completas e atualizadas. O uso de dados falsos pode resultar no cancelamento do pedido. Você é responsável por manter a confidencialidade de sua senha.</p>
      </section>

      <section>
        <h2>5. Pagamento</h2>
        <p>Aceitamos pagamento via PIX, cartão de crédito (até 3x sem juros) e boleto bancário. O pedido só será processado após a confirmação do pagamento.</p>
      </section>

      <section>
        <h2>6. Entrega</h2>
        <p>Os prazos de entrega variam de acordo com a região e são calculados a partir da confirmação do pagamento. Pedidos acima de R$ 199 possuem frete grátis.</p>
      </section>

      <section>
        <h2>7. Trocas e Devoluções</h2>
        <p>Consulte nossa <Link to="/trocas-e-devolucoes">Política de Trocas e Devoluções</Link> para informações detalhadas.</p>
      </section>

      <section>
        <h2>8. Propriedade Intelectual</h2>
        <p>Todo o conteúdo do site, incluindo textos, imagens, logotipos e design, é de propriedade da Esdra Cosméticos ou de seus licenciadores. É proibida a reprodução sem autorização prévia.</p>
      </section>

      <section>
        <h2>9. Contato</h2>
        <p>Para dúvidas sobre estes termos, entre em contato pelo e-mail lojadares@gmail.com ou WhatsApp (18) 99145-9429.</p>
      </section>
    </InfoPage>
  );
}
