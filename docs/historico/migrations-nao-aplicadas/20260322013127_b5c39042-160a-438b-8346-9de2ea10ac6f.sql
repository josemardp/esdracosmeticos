CREATE OR REPLACE FUNCTION public.create_purchase_order(
  p_supplier_id uuid,
  p_items jsonb,
  p_installments integer DEFAULT 1,
  p_discount numeric DEFAULT 0,
  p_freight numeric DEFAULT 0,
  p_notes text DEFAULT NULL,
  p_order_date timestamp with time zone DEFAULT now(),
  p_expected_delivery date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_po_id uuid;
  v_po_code text;
  v_subtotal numeric := 0;
  v_total numeric := 0;
  v_item jsonb;
  v_owner uuid := auth.uid();
  v_inst_amount numeric;
  v_this_amount numeric;
  v_due date;
  v_base_date date;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.suppliers WHERE id = p_supplier_id AND owner_user_id = v_owner AND active = true) THEN
    RAISE EXCEPTION 'Fornecedor não encontrado ou inativo';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_subtotal := v_subtotal + ((v_item->>'qty')::int * (v_item->>'unit_cost')::numeric);
  END LOOP;

  v_total := v_subtotal - p_discount + p_freight;
  IF v_total < 0 THEN v_total := 0; END IF;

  INSERT INTO public.purchase_orders (
    po_code, supplier_id, subtotal, discount, freight, total,
    installments, status, order_date, expected_delivery, notes, owner_user_id
  ) VALUES (
    '', p_supplier_id, v_subtotal, p_discount, p_freight, v_total,
    p_installments, 'confirmed', p_order_date, p_expected_delivery, p_notes, v_owner
  ) RETURNING id, po_code INTO v_po_id, v_po_code;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.purchase_order_items (purchase_order_id, product_id, name, quantity, unit_cost, subtotal)
    VALUES (
      v_po_id,
      CASE WHEN v_item->>'product_id' IS NOT NULL AND v_item->>'product_id' <> '' THEN (v_item->>'product_id')::uuid ELSE NULL END,
      v_item->>'name',
      (v_item->>'qty')::int,
      (v_item->>'unit_cost')::numeric,
      (v_item->>'qty')::int * (v_item->>'unit_cost')::numeric
    );
  END LOOP;

  v_base_date := COALESCE(p_order_date::date, CURRENT_DATE);
  v_inst_amount := ROUND(v_total / p_installments, 2);

  FOR i IN 1..p_installments LOOP
    v_due := (v_base_date + ((i - 1) || ' months')::interval)::date;
    v_this_amount := CASE WHEN i = p_installments THEN v_total - (v_inst_amount * (p_installments - 1)) ELSE v_inst_amount END;

    INSERT INTO public.payable_titles (
      purchase_order_id, supplier_id, description, amount, paid_amount,
      due_date, installment_number, total_installments, owner_user_id, status
    ) VALUES (
      v_po_id, p_supplier_id,
      CASE WHEN p_installments = 1 THEN 'Compra ' || v_po_code
           ELSE 'Compra ' || v_po_code || ' (' || i || '/' || p_installments || ')'
      END,
      v_this_amount, 0, v_due, i, p_installments, v_owner, 'pending'
    );
  END LOOP;

  RETURN jsonb_build_object('po_id', v_po_id, 'po_code', v_po_code, 'total', v_total, 'installments', p_installments);
END;
$function$;