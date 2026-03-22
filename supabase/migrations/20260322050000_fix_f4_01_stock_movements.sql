-- Fix F4-01: Ensure stock movements from PO reception are visible to admins
-- Validação de propriedade mantida via auth.uid() na busca da PO
-- Visibilidade de stock_movements garantida herdando v_po.owner_user_id

CREATE OR REPLACE FUNCTION public.receive_purchase_order(p_po_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_po RECORD;
  v_item RECORD;
  v_owner uuid := auth.uid(); -- Identifica o usuário atual
  v_new_qty integer;
  v_total_items integer := 0;
BEGIN
  -- Busca PO validando se o usuário atual é o proprietário (Segurança)
  SELECT * INTO v_po FROM public.purchase_orders 
  WHERE id = p_po_id AND owner_user_id = v_owner 
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Pedido de compra não encontrado ou sem permissão'; END IF;
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

      -- Insere movimento herdando o proprietário da PO (Visibilidade RLS)
      INSERT INTO public.stock_movements (
        product_id, quantity, type, reason, reference_type, reference_id, 
        cost_at_time, balance_after, owner_user_id
      )
      VALUES (
        v_item.product_id, v_item.quantity, 'entry', 'Recebimento: ' || v_po.po_code, 
        'purchase_order', p_po_id, v_item.unit_cost, v_new_qty, v_po.owner_user_id
      );
    END IF;
    v_total_items := v_total_items + v_item.quantity;
  END LOOP;

  UPDATE public.purchase_orders SET status = 'received', updated_at = now() WHERE id = p_po_id;

  RETURN jsonb_build_object('po_id', p_po_id, 'po_code', v_po.po_code, 'items_received', v_total_items);
END;
$$;
