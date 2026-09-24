import { InfoPage } from "@/components/store/InfoPage";
import { useSEO } from "@/hooks/use-seo";

export default function PoliticaPrivacidadePage() {
  useSEO("Política de Privacidade", "Saiba como a Esdra Cosméticos protege seus dados pessoais e garante sua privacidade.");
  return (
    <InfoPage title="Política de Privacidade" updated="março de 2026" whatsappMessage="Olá, tenho uma dúvida sobre os meus dados na Esdra Cosméticos.">
      <section>
        <h2>1. Informações que coletamos</h2>
        <p>A Esdra Cosméticos coleta apenas as informações necessárias para processar seus pedidos e melhorar sua experiência de compra. Isso inclui:</p>
        <ul>
          <li>Nome completo, e-mail e telefone para contato e envio de pedidos</li>
          <li>Endereço de entrega para envio dos produtos</li>
          <li>Dados de navegação anônimos para melhoria do site</li>
        </ul>
      </section>

      <section>
        <h2>2. Como usamos seus dados</h2>
        <p>Utilizamos seus dados exclusivamente para:</p>
        <ul>
          <li>Processar e entregar seus pedidos</li>
          <li>Enviar atualizações sobre o status do pedido</li>
          <li>Enviar comunicações de marketing, caso autorizado</li>
          <li>Melhorar nossos produtos e serviços</li>
        </ul>
      </section>

      <section>
        <h2>3. Compartilhamento de dados</h2>
        <p>Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros para fins de marketing. Seus dados podem ser compartilhados apenas com transportadoras para entrega dos pedidos e com processadores de pagamento para conclusão das transações.</p>
      </section>

      <section>
        <h2>4. Segurança</h2>
        <p>Adotamos medidas de segurança para proteger seus dados pessoais contra acesso não autorizado, alteração, divulgação ou destruição. Utilizamos criptografia SSL em todas as transações.</p>
      </section>

      <section>
        <h2>5. Seus direitos</h2>
        <p>Conforme a Lei Geral de Proteção de Dados (LGPD), você tem direito a acessar, corrigir, excluir ou solicitar a portabilidade dos seus dados pessoais. Para exercer esses direitos, entre em contato pelo e-mail lojadares@gmail.com ou pelo WhatsApp (18) 99145-9429.</p>
      </section>

      <section>
        <h2>6. Contato</h2>
        <p>Em caso de dúvidas sobre esta política, entre em contato:</p>
        <ul>
          <li>E-mail: lojadares@gmail.com</li>
          <li>WhatsApp: (18) 99145-9429</li>
        </ul>
      </section>
    </InfoPage>
  );
}
