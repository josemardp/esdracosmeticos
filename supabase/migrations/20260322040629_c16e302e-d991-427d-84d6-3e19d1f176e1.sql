
-- Phase 4: Stock movements table
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id),
  quantity integer NOT NULL DEFAULT 0,
  type text NOT NULL DEFAULT 'entry',
  reason text NOT NULL DEFAULT '',
  reference_type text,
  reference_id uuid,
  cost_at_time numeric(12,2),
  balance_after integer NOT NULL DEFAULT 0,
  owner_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages stock movements" ON public.stock_movements FOR ALL TO authenticated USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());

-- Add avg_cost to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS avg_cost numeric(12,2) DEFAULT 0;

-- Phase 5: Customer notes
CREATE TABLE IF NOT EXISTS public.customer_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  note text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage customer notes" ON public.customer_notes FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Customer segments
CREATE TABLE IF NOT EXISTS public.customer_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  rules jsonb NOT NULL DEFAULT '{}',
  owner_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.customer_segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages segments" ON public.customer_segments FOR ALL TO authenticated USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());
CREATE TRIGGER trg_segments_updated_at BEFORE UPDATE ON public.customer_segments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Phase 6: Audit log
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity text NOT NULL,
  entity_id text,
  action text NOT NULL,
  details jsonb,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read audit log" ON public.audit_log FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert audit log" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));

-- RPC: Receive purchase order (updates stock + cost)
CREATE OR REPLACE FUNCTION public.receive_purchase_order(p_po_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_po RECORD;
  v_item RECORD;
  v_owner uuid := auth.uid();
  v_new_qty integer;
  v_total_items integer := 0;
BEGIN
  SELECT * INTO v_po FROM public.purchase_orders WHERE id = p_po_id AND owner_user_id = v_owner FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pedido de compra não encontrado'; END IF;
  IF v_po.status = 'received' THEN RAISE EXCEPTION 'Pedido já foi recebido'; END IF;

  FOR v_item IN SELECT * FROM public.purchase_order_items WHERE purchase_order_id = p_po_id
  LOOP
    IF v_item.product_id IS NOT NULL THEN
      UPDATE public.products
      SET inventory_count = inventory_count + v_item.quantity,
          cost = v_item.unit_cost,
          avg_cost = CASE
            WHEN inventory_count = 0 THEN v_item.unit_cost
            ELSE ROUND((COALESCE(avg_cost, 0) * inventory_count + v_item.unit_cost * v_item.quantity)::numeric / (inventory_count + v_item.quantity), 2)
          END,
          updated_at = now()
      WHERE id = v_item.product_id;

      SELECT inventory_count INTO v_new_qty FROM public.products WHERE id = v_item.product_id;

      INSERT INTO public.stock_movements (product_id, quantity, type, reason, reference_type, reference_id, cost_at_time, balance_after, owner_user_id)
      VALUES (v_item.product_id, v_item.quantity, 'entry', 'Recebimento: ' || v_po.po_code, 'purchase_order', p_po_id, v_item.unit_cost, v_new_qty, v_owner);
    END IF;
    v_total_items := v_total_items + v_item.quantity;
  END LOOP;

  UPDATE public.purchase_orders SET status = 'received', updated_at = now() WHERE id = p_po_id;

  RETURN jsonb_build_object('po_id', p_po_id, 'po_code', v_po.po_code, 'items_received', v_total_items);
END;
$$;

-- RPC: Adjust stock manually with audit trail
CREATE OR REPLACE FUNCTION public.adjust_stock(p_product_id uuid, p_new_quantity integer, p_reason text DEFAULT 'Ajuste manual')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_owner uuid := auth.uid();
  v_current integer;
  v_diff integer;
  v_type text;
BEGIN
  SELECT inventory_count INTO v_current FROM public.products WHERE id = p_product_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Produto não encontrado'; END IF;

  v_diff := p_new_quantity - v_current;
  IF v_diff = 0 THEN RETURN jsonb_build_object('product_id', p_product_id, 'old_qty', v_current, 'new_qty', p_new_quantity, 'changed', false); END IF;

  v_type := CASE WHEN v_diff > 0 THEN 'entry' ELSE 'exit' END;

  UPDATE public.products SET inventory_count = p_new_quantity, updated_at = now() WHERE id = p_product_id;

  INSERT INTO public.stock_movements (product_id, quantity, type, reason, reference_type, balance_after, owner_user_id)
  VALUES (p_product_id, ABS(v_diff), v_type, p_reason, 'manual', p_new_quantity, v_owner);

  RETURN jsonb_build_object('product_id', p_product_id, 'old_qty', v_current, 'new_qty', p_new_quantity, 'changed', true);
END;
$$;
