import { InfoPage } from "@/components/store/InfoPage";
import { useSEO } from "@/hooks/use-seo";

export default function TrocasDevolucoesPage() {
  useSEO("Trocas e Devoluções", "Política de trocas e devoluções da Esdra Cosméticos. Peça a troca em até 7 dias depois de receber o pedido.");
  return (
    <InfoPage
      title="Trocas e Devoluções"
      lead={<>Você tem até <strong className="font-semibold">7 dias</strong> depois de receber o pedido para pedir troca ou devolução. É só chamar a gente no WhatsApp.</>}
      whatsappMessage="Olá, gostaria de solicitar uma troca ou devolução."
    >
      <section>
        <h2>Prazo para troca ou devolução</h2>
        <p>Você tem até <strong>7 dias corridos</strong> após o recebimento do produto para solicitar troca ou devolução, conforme o Código de Defesa do Consumidor.</p>
      </section>

      <section>
        <h2>Condições para troca ou devolução</h2>
        <ul>
          <li>O produto deve estar <strong>lacrado e na embalagem original</strong>, sem sinais de uso</li>
          <li>Deve acompanhar todos os acessórios e brindes enviados</li>
          <li>O comprovante de compra (e-mail de confirmação) deve ser apresentado</li>
          <li>Produtos com defeito de fabricação podem ser trocados mesmo se abertos</li>
        </ul>
      </section>

      <section>
        <h2>Como solicitar</h2>
        <ol>
          <li>Entre em contato pelo WhatsApp <strong className="whitespace-nowrap">(18) 99145-9429</strong> ou pelo e-mail <strong>lojadares@gmail.com</strong></li>
          <li>Informe o número do pedido e o motivo da troca ou devolução</li>
          <li>Aguarde as instruções para envio do produto</li>
          <li>Após receber e aprovar o produto devolvido, processaremos a troca ou reembolso em até 7 dias úteis</li>
        </ol>
      </section>

      <section>
        <h2>Custos de envio</h2>
        <ul>
          <li><strong>Defeito de fabricação:</strong> frete de devolução por nossa conta</li>
          <li><strong>Arrependimento ou troca por preferência:</strong> frete de devolução por conta do cliente</li>
        </ul>
      </section>

      <section>
        <h2>Reembolso</h2>
        <p>O reembolso será feito pela mesma forma de pagamento utilizada na compra, em até 7 dias úteis após a aprovação da devolução. Em compras parceladas no cartão, o estorno seguirá a política da administradora do cartão.</p>
      </section>
    </InfoPage>
  );
}
