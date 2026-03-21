
-- 1. Nova função para processamento atômico de pedido (estoque e cupom)
CREATE OR REPLACE FUNCTION public.process_order_inventory_and_coupon(
  p_items JSONB,
  p_coupon_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item_record RECORD;
BEGIN
  -- 1. Decrementar estoque de todos os itens em uma única transação
  FOR item_record IN SELECT * FROM jsonb_to_recordset(p_items) AS x(id UUID, qty INT)
  LOOP
    UPDATE public.products
    SET inventory_count = inventory_count - item_record.qty,
        updated_at = now()
    WHERE id = item_record.id
      AND inventory_count >= item_record.qty;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Estoque insuficiente para o produto ID %', item_record.id;
    END IF;
  END LOOP;

  -- 2. Incrementar uso do cupom se fornecido
  IF p_coupon_id IS NOT NULL THEN
    UPDATE public.coupons
    SET usage_count = usage_count + 1
    WHERE id = p_coupon_id;
  END IF;
END;
$$;

-- 2. Conceder permissão para execução pública (necessário para checkout de convidados)
GRANT EXECUTE ON FUNCTION public.process_order_inventory_and_coupon(JSONB, UUID) TO anon, authenticated;
