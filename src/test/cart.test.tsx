import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";

const rpc = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc: (...a: unknown[]) => rpc(...a) } }));
vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));

import { CartProvider, useCart } from "@/contexts/CartContext";

const wrapper = ({ children }: { children: ReactNode }) => <CartProvider>{children}</CartProvider>;

const batom = { id: "p1", name: "Batom", slug: "batom", price: 50, sale_price: null, cover_image: null, inventory_count: 3 };
const perfume = { id: "p2", name: "Perfume", slug: "perfume", price: 200, sale_price: 150, cover_image: null, inventory_count: 10 };

describe("carrinho", () => {
  beforeEach(() => {
    localStorage.clear();
    rpc.mockReset();
  });

  it("subtotal usa o preço promocional quando existe", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(batom, 2));
    act(() => result.current.addItem(perfume, 1));
    expect(result.current.itemCount).toBe(3);
    expect(result.current.subtotal).toBe(2 * 50 + 150);
    expect(result.current.total).toBe(250);
  });

  it("não passa do estoque disponível", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(batom, 5));
    expect(result.current.items[0].qty).toBe(3);
    act(() => result.current.addItem(batom, 1));
    expect(result.current.items[0].qty).toBe(3);
    act(() => result.current.updateQty("p1", 10));
    expect(result.current.items[0].qty).toBe(3);
  });

  it("produto esgotado não entra e quantidade zero remove", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem({ ...batom, inventory_count: 0 }));
    expect(result.current.items).toHaveLength(0);
    act(() => result.current.addItem(perfume));
    act(() => result.current.updateQty("p2", 0));
    expect(result.current.items).toHaveLength(0);
  });

  it("cupom válido desconta do total e o código vai em maiúsculas", async () => {
    rpc.mockResolvedValue({ data: [{ coupon_id: "c1", discount_value: "20" }], error: null });
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(batom, 2));
    let ok = false;
    await act(async () => { ok = await result.current.applyCoupon("esdra10"); });
    expect(ok).toBe(true);
    expect(rpc).toHaveBeenCalledWith("validate_coupon", { p_code: "ESDRA10", p_order_total: 100 });
    expect(result.current.discount).toBe(20);
    expect(result.current.total).toBe(80);
  });

  it("cupom inválido não altera o total", async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(batom, 1));
    let ok = true;
    await act(async () => { ok = await result.current.applyCoupon("NAOEXISTE"); });
    expect(ok).toBe(false);
    expect(result.current.coupon).toBeNull();
    expect(result.current.total).toBe(50);
  });

  it("total nunca fica negativo, mesmo com desconto maior que o subtotal", async () => {
    rpc.mockResolvedValue({ data: [{ coupon_id: "c1", discount_value: 500 }], error: null });
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(batom, 1));
    await act(async () => { await result.current.applyCoupon("X"); });
    expect(result.current.total).toBe(0);
  });

  it("alterar o carrinho remove o cupom aplicado", async () => {
    rpc.mockResolvedValue({ data: [{ coupon_id: "c1", discount_value: 10 }], error: null });
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem(batom, 1));
    await act(async () => { await result.current.applyCoupon("X"); });
    expect(result.current.coupon).not.toBeNull();
    act(() => result.current.addItem(perfume, 1));
    expect(result.current.coupon).toBeNull();
    expect(result.current.total).toBe(200);
  });
});
