import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface CartItem {
  id: string; // product id
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  cover_image: string | null;
  qty: number;
  inventory_count: number;
}

interface CouponDiscount {
  coupon_id: string;
  code: string;
  discount_value: number;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  discount: number;
  total: number;
  coupon: CouponDiscount | null;
  addItem: (product: Omit<CartItem, "qty">, qty?: number) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType>({
  items: [], itemCount: 0, subtotal: 0, discount: 0, total: 0, coupon: null,
  addItem: () => {}, removeItem: () => {}, updateQty: () => {},
  applyCoupon: async () => false, removeCoupon: () => {}, clearCart: () => {},
});

const CART_KEY = "esdra_cart";
const COUPON_KEY = "esdra_coupon";

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function loadCoupon(): CouponDiscount | null {
  try {
    const raw = localStorage.getItem(COUPON_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);
  const [coupon, setCoupon] = useState<CouponDiscount | null>(loadCoupon);

  // Persist
  useEffect(() => { localStorage.setItem(CART_KEY, JSON.stringify(items)); }, [items]);
  useEffect(() => {
    if (coupon) localStorage.setItem(COUPON_KEY, JSON.stringify(coupon));
    else localStorage.removeItem(COUPON_KEY);
  }, [coupon]);

  const itemCount = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + (i.sale_price ?? i.price) * i.qty, 0);

  // Recalc discount when subtotal changes
  const discount = coupon ? coupon.discount_value : 0;
  const total = Math.max(0, subtotal - discount);

  const addItem = useCallback((product: Omit<CartItem, "qty">, qty = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        const newQty = Math.min(existing.qty + qty, product.inventory_count);
        if (newQty === existing.qty) {
          toast({ title: "Estoque insuficiente", description: "Quantidade máxima atingida.", variant: "destructive" });
          return prev;
        }
        toast({ title: "Carrinho atualizado", description: `${product.name} (${newQty}x)` });
        return prev.map(i => i.id === product.id ? { ...i, qty: newQty, inventory_count: product.inventory_count } : i);
      }
      if (product.inventory_count <= 0) {
        toast({ title: "Produto esgotado", variant: "destructive" });
        return prev;
      }
      toast({ title: "Adicionado ao carrinho!", description: `${qty}x ${product.name}` });
      return [...prev, { ...product, qty: Math.min(qty, product.inventory_count) }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.id !== productId));
  }, []);

  const updateQty = useCallback((productId: string, qty: number) => {
    if (qty <= 0) { removeItem(productId); return; }
    setItems(prev => prev.map(i => {
      if (i.id !== productId) return i;
      const clamped = Math.min(qty, i.inventory_count);
      if (clamped < qty) toast({ title: "Estoque insuficiente", variant: "destructive" });
      return { ...i, qty: clamped };
    }));
  }, [removeItem]);

  const applyCoupon = useCallback(async (code: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc("validate_coupon", {
        p_code: code.toUpperCase(),
        p_order_total: subtotal,
      });
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) throw new Error("Cupom inválido");
      const result = data[0];
      const c: CouponDiscount = { coupon_id: result.coupon_id, code: code.toUpperCase(), discount_value: Number(result.discount_value) };
      setCoupon(c);
      toast({ title: "Cupom aplicado!", description: `Desconto de R$ ${c.discount_value.toFixed(2)}` });
      return true;
    } catch (err: any) {
      toast({ title: "Cupom inválido", description: err.message, variant: "destructive" });
      return false;
    }
  }, [subtotal]);

  const removeCoupon = useCallback(() => { setCoupon(null); }, []);
  const clearCart = useCallback(() => { setItems([]); setCoupon(null); }, []);

  return (
    <CartContext.Provider value={{ items, itemCount, subtotal, discount, total, coupon, addItem, removeItem, updateQty, applyCoupon, removeCoupon, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
