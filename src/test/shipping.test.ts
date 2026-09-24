import { describe, it, expect } from "vitest";
import {
  FREE_SHIPPING_THRESHOLD,
  getShippingCost,
  qualifiesForFreeShipping,
  getShippingLabel,
  getShippingDisclaimer,
  getFreeShippingMessage,
} from "@/lib/shipping";

describe("regra de frete", () => {
  it("frete grátis começa exatamente em R$ 199", () => {
    expect(FREE_SHIPPING_THRESHOLD).toBe(199);
    expect(qualifiesForFreeShipping(198.99)).toBe(false);
    expect(qualifiesForFreeShipping(199)).toBe(true);
    expect(qualifiesForFreeShipping(500)).toBe(true);
  });

  it("frete nunca entra no total (abaixo do mínimo é combinado pelo WhatsApp)", () => {
    expect(getShippingCost(50)).toBe(0);
    expect(getShippingCost(199)).toBe(0);
  });

  it("rótulo e aviso mudam conforme o mínimo", () => {
    expect(getShippingLabel(199)).toBe("Grátis");
    expect(getShippingLabel(100)).toBe("A combinar via WhatsApp");
    expect(getShippingDisclaimer(199)).toBeNull();
    expect(getShippingDisclaimer(100)).toMatch(/WhatsApp/);
  });

  it("mensagem de incentivo mostra quanto falta", () => {
    expect(getFreeShippingMessage(150)).toBe("Faltam R$ 49.00 para frete grátis");
    expect(getFreeShippingMessage(199)).toBeNull();
  });
});
