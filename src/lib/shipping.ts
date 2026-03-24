/** Regra centralizada de frete da Esdra Cosméticos. */

/** Valor mínimo do pedido para frete grátis (em reais). */
export const FREE_SHIPPING_THRESHOLD = 199;

/** Calcula o valor do frete com base no subtotal do pedido. */
export function getShippingCost(subtotal: number): number {
  // Frete grátis acima do threshold
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  // Abaixo do threshold: frete a combinar (por enquanto 0, pois o pagamento é via WhatsApp)
  return 0;
}

/** Retorna true se o subtotal qualifica para frete grátis. */
export function qualifiesForFreeShipping(subtotal: number): boolean {
  return subtotal >= FREE_SHIPPING_THRESHOLD;
}

/** Mensagem de frete para exibição ao cliente. */
export function getShippingLabel(subtotal: number): string {
  if (qualifiesForFreeShipping(subtotal)) return "Grátis";
  return "A combinar via WhatsApp";
}

/** Nota explicativa quando o frete ainda não está incluso no total. */
export function getShippingDisclaimer(subtotal: number): string | null {
  if (qualifiesForFreeShipping(subtotal)) return null;
  return "* Total sem frete. O valor do frete será informado pelo WhatsApp antes do pagamento.";
}

/** Mensagem de incentivo para atingir frete grátis. */
export function getFreeShippingMessage(subtotal: number): string | null {
  if (qualifiesForFreeShipping(subtotal)) return null;
  const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
  return `Faltam R$ ${remaining.toFixed(2)} para frete grátis`;
}
