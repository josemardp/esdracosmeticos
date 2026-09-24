-- ============================================================
-- Teste do checkout contra o banco de produção, sem deixar rastro.
-- Tudo roda numa transação que termina em ROLLBACK.
-- Rodar: npm run test:db   (CLI do Supabase logada na org da loja)
-- Qualquer falha interrompe com "FALHOU: ..."; sucesso termina com
-- a linha resultado = 'checkout ok'.
-- ============================================================

BEGIN;

CREATE TEMP TABLE t_ctx ON COMMIT DROP AS
SELECT
  (SELECT id FROM public.products
    WHERE active AND price > 0 AND inventory_count >= 3
    ORDER BY id LIMIT 1) AS pid,
  (SELECT id FROM public.products WHERE NOT active LIMIT 1) AS inactive_pid;
GRANT SELECT ON t_ctx TO anon;

-- Cupom só existe dentro deste teste
INSERT INTO public.coupons (code, type, value, min_order, active)
VALUES ('TESTE-CHECKOUT', 'percentage', 10, 0, true);

SET LOCAL ROLE anon;

DO $$
DECLARE
  c        t_ctx%ROWTYPE;
  r        jsonb;
  stock0   int;
  v_price  numeric;
  addr     jsonb := '{"street":"Rua Teste","city":"Guararapes","state":"SP","zip":"16700000"}';
BEGIN
  SELECT * INTO c FROM t_ctx;
  IF c.pid IS NULL THEN RAISE EXCEPTION 'FALHOU: nenhum produto ativo com estoque >= 3'; END IF;
  SELECT inventory_count, COALESCE(sale_price, price) INTO stock0, v_price
    FROM public.products WHERE id = c.pid;

  -- 1. Pedido de convidado com cupom: preço vem do banco, desconto de 10%
  r := public.create_order(
    jsonb_build_array(jsonb_build_object('product_id', c.pid, 'qty', 2)),
    'Teste Checkout', 'teste.checkout@exemplo.com', '18999990000', addr, 'PIX', 'teste-checkout');
  IF (r->>'subtotal')::numeric <> v_price * 2 THEN
    RAISE EXCEPTION 'FALHOU: subtotal % <> %', r->>'subtotal', v_price * 2; END IF;
  IF (r->>'discount')::numeric <> round(v_price * 2 * 0.10, 2) THEN
    RAISE EXCEPTION 'FALHOU: desconto %', r->>'discount'; END IF;
  IF r->>'order_code' NOT LIKE 'ESD-%' THEN
    RAISE EXCEPTION 'FALHOU: código %', r->>'order_code'; END IF;
  IF (SELECT inventory_count FROM public.products WHERE id = c.pid) <> stock0 - 2 THEN
    RAISE EXCEPTION 'FALHOU: estoque não baixou 2 unidades'; END IF;

  -- 2. Casos que precisam ser recusados
  BEGIN
    PERFORM public.create_order(jsonb_build_array(jsonb_build_object('product_id', c.pid, 'qty', -5)),
      'Teste Checkout', 'teste.checkout@exemplo.com', '1', addr, 'PIX');
    RAISE EXCEPTION 'FALHOU: aceitou quantidade negativa';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'FALHOU%' THEN RAISE; END IF;
  END;

  IF c.inactive_pid IS NOT NULL THEN
    BEGIN
      PERFORM public.create_order(jsonb_build_array(jsonb_build_object('product_id', c.inactive_pid, 'qty', 1)),
        'Teste Checkout', 'teste.checkout@exemplo.com', '1', addr, 'PIX');
      RAISE EXCEPTION 'FALHOU: aceitou produto inativo';
    EXCEPTION WHEN raise_exception THEN
      IF SQLERRM LIKE 'FALHOU%' THEN RAISE; END IF;
    END;
  END IF;

  BEGIN
    PERFORM public.create_order(jsonb_build_array(jsonb_build_object('product_id', c.pid, 'qty', 999999)),
      'Teste Checkout', 'teste.checkout@exemplo.com', '1', addr, 'PIX');
    RAISE EXCEPTION 'FALHOU: aceitou quantidade acima do estoque';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'FALHOU%' THEN RAISE; END IF;
  END;

  BEGIN
    PERFORM public.create_order(jsonb_build_array(jsonb_build_object('product_id', c.pid, 'qty', 1)),
      'Teste Checkout', 'teste.checkout@exemplo.com', '1', addr, 'PIX', 'CUPOM-QUE-NAO-EXISTE');
    RAISE EXCEPTION 'FALHOU: aceitou cupom inexistente';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'FALHOU%' THEN RAISE; END IF;
  END;

  -- 3. Permissões do visitante
  BEGIN
    PERFORM public.decrement_inventory(c.pid, 0);
    RAISE EXCEPTION 'FALHOU: anon executou decrement_inventory';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  BEGIN
    PERFORM cost FROM public.products LIMIT 1;
    RAISE EXCEPTION 'FALHOU: anon leu o custo';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;

RESET ROLE;

-- 4. Efeitos gravados pelo pedido do passo 1
DO $$
DECLARE
  c t_ctx%ROWTYPE;
BEGIN
  SELECT * INTO c FROM t_ctx;
  IF (SELECT usage_count FROM public.coupons WHERE code = 'TESTE-CHECKOUT') <> 1 THEN
    RAISE EXCEPTION 'FALHOU: uso do cupom não foi contado'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.order_items oi JOIN public.orders o ON o.id = oi.order_id
                 JOIN public.customers cu ON cu.id = o.customer_id
                 WHERE cu.email = 'teste.checkout@exemplo.com' AND oi.product_id = c.pid AND oi.quantity = 2) THEN
    RAISE EXCEPTION 'FALHOU: item do pedido não gravado'; END IF;
END $$;

SELECT 'checkout ok' AS resultado,
       (SELECT inventory_count FROM public.products WHERE id = (SELECT pid FROM t_ctx)) AS estoque_dentro_do_teste;

ROLLBACK;
