/** Número oficial de WhatsApp da Esdra Cosméticos (com código do país). */
export const WHATSAPP_PHONE = "5518991459429";

/** Monta URL de abertura do WhatsApp com mensagem pré-preenchida. */
export function whatsappUrl(message?: string): string {
  const base = `https://wa.me/${WHATSAPP_PHONE}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
