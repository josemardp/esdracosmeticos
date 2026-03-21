-- Drop old function to change signature
DROP FUNCTION IF EXISTS public.process_order_inventory_and_coupon(JSONB, UUID);

-- New function that validates order totals and coupon
CREATE OR REPLACE FUNCTION public.process_order_inventory_and_coupon(
  p_order_id UUID,
  p_coupon_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subtotal NUMERIC := 0;
  v_discount NUMERIC := 0;
  v_total NUMERIC := 0;
  v_coupon_record RECORD;
  v_item_record RECORD;
BEGIN
  -- 1. Recalculate subtotal from order_items to avoid trusting frontend
  SELECT COALESCE(SUM(quantity * unit_price), 0) INTO v_subtotal
  FROM public.order_items
  WHERE order_id = p_order_id;

  -- 2. Validate and calculate discount if coupon provided
  IF p_coupon_id IS NOT NULL THEN
    SELECT * INTO v_coupon_record
    FROM public.coupons
    WHERE id = p_coupon_id AND active = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Cupom inválido ou inativo';
    END IF;

    IF v_subtotal < v_coupon_record.min_order THEN
      RAISE EXCEPTION 'Pedido não atinge o valor mínimo para este cupom (R$ %)', v_coupon_record.min_order;
    END IF;

    IF v_coupon_record.usage_limit IS NOT NULL AND v_coupon_record.usage_count >= v_coupon_record.usage_limit THEN
      RAISE EXCEPTION 'Cupom esgotado';
    END IF;

    IF v_coupon_record.type = 'percentage' THEN
      v_discount := v_subtotal * (v_coupon_record.value / 100.0);
    ELSE
      v_discount := v_coupon_record.value;
    END IF;

    -- Ensure discount doesn't exceed subtotal
    v_discount := LEAST(v_discount, v_subtotal);

    -- Increment coupon usage
    UPDATE public.coupons
    SET usage_count = usage_count + 1
    WHERE id = p_coupon_id;
  END IF;

  v_total := v_subtotal - v_discount;

  -- 3. Update order with validated totals
  UPDATE public.orders
  SET subtotal = v_subtotal,
      discount = v_discount,
      total = v_total,
      updated_at = now()
  WHERE id = p_order_id;

  -- 4. Decrement inventory for all items in the order
  FOR v_item_record IN SELECT product_id, quantity FROM public.order_items WHERE order_id = p_order_id
  LOOP
    IF v_item_record.product_id IS NOT NULL THEN
      UPDATE public.products
      SET inventory_count = inventory_count - v_item_record.quantity,
          updated_at = now()
      WHERE id = v_item_record.product_id
        AND inventory_count >= v_item_record.quantity;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Estoque insuficiente para um ou mais produtos no pedido';
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION public.process_order_inventory_and_coupon(UUID, UUID) TO authenticated;
-- If you need anon access for guest checkout, uncomment below:
-- GRANT EXECUTE ON FUNCTION public.process_order_inventory_and_coupon(UUID, UUID) TO anon;
