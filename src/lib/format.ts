// Preço no padrão brasileiro: "R$ 110,90" (antes parte do site mostrava "R$ 110.90").
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatBRL(value: number): string {
  // O Intl separa "R$" do número com espaço não quebrável; mantém assim para o preço não partir em duas linhas.
  return brl.format(value);
}

// Mesma conta de antes (preço / 3), só o texto no padrão brasileiro.
export function formatInstallments(value: number, times = 3): string {
  return `${times}x de ${formatBRL(value / times)} sem juros`;
}
