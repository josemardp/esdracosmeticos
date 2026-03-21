-- ============================================================
-- MIGRATION: create_order — cálculo de preço 100% server-side
-- Substitui o fluxo de 4 chamadas sequenciais do frontend por
-- uma única transação atômica no PostgreSQL.
--
-- SEGURANÇA:
--   - Preços buscados do banco, nunca do frontend
--   - Cupom validado e recalculado server-side via coupon CODE
--   - Estoque decrementado atomicamente dentro da mesma transação
--   - Guest checkout seguro: reutiliza apenas customers sem user_id
--   - SECURITY DEFINER com search_path fixo
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_order(
  -- Itens do carrinho: apenas IDs e quantidades — preços ignorados
  p_items          JSONB,        -- [{ "product_id": "uuid", "qty": 2 }, ...]

  -- Dados do cliente
  p_customer_name  TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT,

  -- Endereço de entrega (snapshot)
  p_address        JSONB,        -- { street, number, complement, neighborhood, city, state, zip }

  -- Pagamento
  p_payment_method TEXT,

  -- Cupom: passa o CODE (string), não o ID
  -- O servidor valida, busca e aplica — sem confiar no frontend
  p_coupon_code    TEXT DEFAULT NULL,

  -- user_id do usuário logado (NULL para convidado)
  p_user_id        UUID DEFAULT NULL
)
RETURNS JSONB  -- { order_code, subtotal, discount, total }
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id    UUID;
  v_order_id       UUID;
  v_order_code     TEXT;
  v_subtotal       NUMERIC(10,2) := 0;
  v_discount       NUMERIC(10,2) := 0;
  v_total          NUMERIC(10,2) := 0;
  v_coupon         RECORD;
  v_item           RECORD;
  v_product        RECORD;
BEGIN

  -- ──────────────────────────────────────────────────────────
  -- 1. VALIDAÇÕES INICIAIS
  -- ──────────────────────────────────────────────────────────

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Carrinho vazio';
  END IF;

  IF p_customer_name IS NULL OR length(trim(p_customer_name)) < 2 THEN
    RAISE EXCEPTION 'Nome do cliente inválido';
  END IF;

  IF p_customer_email IS NULL OR p_customer_email NOT LIKE '%@%' THEN
    RAISE EXCEPTION 'E-mail inválido';
  END IF;

  IF p_payment_method IS NULL OR trim(p_payment_method) = '' THEN
    RAISE EXCEPTION 'Forma de pagamento obrigatória';
  END IF;

  -- ──────────────────────────────────────────────────────────
  -- 2. CALCULAR SUBTOTAL COM PREÇOS DO BANCO
  --    Ignora completamente qualquer preço enviado pelo frontend
  -- ──────────────────────────────────────────────────────────

  FOR v_item IN
    SELECT
      x.product_id,
      x.qty,
      p.name,
      COALESCE(p.sale_price, p.price) AS unit_price,
      p.inventory_count
    FROM jsonb_to_recordset(p_items) AS x(product_id UUID, qty INT)
    JOIN public.products p ON p.id = x.product_id
    WHERE p.active = true
  LOOP
    -- Validar quantidade
    IF v_item.qty <= 0 THEN
      RAISE EXCEPTION 'Quantidade inválida para o produto %', v_item.name;
    END IF;

    -- Verificar estoque antes de qualquer insert
    IF v_item.inventory_count < v_item.qty THEN
      RAISE EXCEPTION 'Estoque insuficiente para "%". Disponível: %, solicitado: %',
        v_item.name, v_item.inventory_count, v_item.qty;
    END IF;

    v_subtotal := v_subtotal + (v_item.unit_price * v_item.qty);
  END LOOP;

  -- Verificar se todos os produtos foram encontrados
  -- (se p_items tinha 3 itens mas só 2 são ativos/existem, o subtotal será menor)
  IF v_subtotal = 0 THEN
    RAISE EXCEPTION 'Nenhum produto válido encontrado no carrinho';
  END IF;

  -- ──────────────────────────────────────────────────────────
  -- 3. VALIDAR E APLICAR CUPOM (server-side, por CODE)
  --    Nunca confia no coupon_id ou discount_value do frontend
  -- ──────────────────────────────────────────────────────────

  IF p_coupon_code IS NOT NULL AND trim(p_coupon_code) <> '' THEN
    SELECT *
    INTO v_coupon
    FROM public.coupons
    WHERE code = upper(trim(p_coupon_code))
      AND active = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Cupom "%" inválido ou inativo', p_coupon_code;
    END IF;

    IF v_coupon.starts_at IS NOT NULL AND now() < v_coupon.starts_at THEN
      RAISE EXCEPTION 'Cupom ainda não está ativo';
    END IF;

    IF v_coupon.ends_at IS NOT NULL AND now() > v_coupon.ends_at THEN
      RAISE EXCEPTION 'Cupom expirado';
    END IF;

    IF v_coupon.usage_limit IS NOT NULL AND v_coupon.usage_count >= v_coupon.usage_limit THEN
      RAISE EXCEPTION 'Limite de uso do cupom atingido';
    END IF;

    IF v_subtotal < v_coupon.min_order THEN
      RAISE EXCEPTION 'Valor mínimo para o cupom é R$ %', v_coupon.min_order;
    END IF;

    -- Calcular desconto pelo tipo
    IF v_coupon.type = 'percentage' THEN
      v_discount := ROUND(v_subtotal * v_coupon.value / 100, 2);
    ELSE
      -- Desconto fixo não pode superar o subtotal
      v_discount := LEAST(v_coupon.value, v_subtotal);
    END IF;
  END IF;

  v_total := GREATEST(0, v_subtotal - v_discount);

  -- ──────────────────────────────────────────────────────────
  -- 4. RESOLVER CUSTOMER
  --    Usuário logado: busca ou cria pelo user_id
  --    Convidado: busca ou cria pelo email (apenas registros sem user_id)
  -- ──────────────────────────────────────────────────────────

  IF p_user_id IS NOT NULL THEN
    -- Usuário autenticado
    SELECT id INTO v_customer_id
    FROM public.customers
    WHERE user_id = p_user_id;

    IF FOUND THEN
      -- Atualizar dados de contato
      UPDATE public.customers
      SET name       = p_customer_name,
          email      = p_customer_email,
          phone      = p_customer_phone,
          updated_at = now()
      WHERE id = v_customer_id;
    ELSE
      -- Criar customer vinculado ao user
      INSERT INTO public.customers (user_id, name, email, phone)
      VALUES (p_user_id, p_customer_name, p_customer_email, p_customer_phone)
      RETURNING id INTO v_customer_id;
    END IF;

  ELSE
    -- Convidado: só reutiliza registros SEM user_id (nunca sobrescreve conta real)
    SELECT id INTO v_customer_id
    FROM public.customers
    WHERE email   = lower(trim(p_customer_email))
      AND user_id IS NULL
    LIMIT 1;

    IF NOT FOUND THEN
      INSERT INTO public.customers (name, email, phone)
      VALUES (p_customer_name, lower(trim(p_customer_email)), p_customer_phone)
      RETURNING id INTO v_customer_id;
    ELSE
      -- Atualizar nome e telefone do convidado recorrente
      UPDATE public.customers
      SET name       = p_customer_name,
          phone      = p_customer_phone,
          updated_at = now()
      WHERE id = v_customer_id;
    END IF;
  END IF;

  -- ──────────────────────────────────────────────────────────
  -- 5. INSERIR O PEDIDO (valores calculados aqui, não do frontend)
  -- ──────────────────────────────────────────────────────────

  INSERT INTO public.orders (
    customer_id,
    order_code,          -- trigger gera ESD-XXXXX automaticamente
    subtotal,
    discount,
    shipping,
    total,
    payment_method,
    payment_status,
    status,
    channel_origin,
    shipping_address_snapshot
  ) VALUES (
    v_customer_id,
    '',                  -- string vazia: trigger trg_generate_order_code dispara
    v_subtotal,
    v_discount,
    0,
    v_total,
    p_payment_method,
    'pending',
    'pending',
    'website',
    p_address
  )
  RETURNING id, order_code INTO v_order_id, v_order_code;

  -- ──────────────────────────────────────────────────────────
  -- 6. INSERIR ORDER_ITEMS (preços buscados do banco no step 2)
  -- ──────────────────────────────────────────────────────────

  INSERT INTO public.order_items (order_id, product_id, name_snapshot, unit_price, quantity, subtotal)
  SELECT
    v_order_id,
    x.product_id,
    p.name,
    COALESCE(p.sale_price, p.price),
    x.qty,
    COALESCE(p.sale_price, p.price) * x.qty
  FROM jsonb_to_recordset(p_items) AS x(product_id UUID, qty INT)
  JOIN public.products p ON p.id = x.product_id AND p.active = true;

  -- ──────────────────────────────────────────────────────────
  -- 7. DECREMENTAR ESTOQUE (atômico — dentro da mesma transação)
  -- ──────────────────────────────────────────────────────────

  FOR v_item IN
    SELECT x.product_id, x.qty, p.name
    FROM jsonb_to_recordset(p_items) AS x(product_id UUID, qty INT)
    JOIN public.products p ON p.id = x.product_id
  LOOP
    UPDATE public.products
    SET inventory_count = inventory_count - v_item.qty,
        updated_at      = now()
    WHERE id = v_item.product_id
      AND inventory_count >= v_item.qty;

    -- Verificação de segurança: se NOT FOUND, o estoque mudou entre o check e o update
    -- (race condition com outro pedido simultâneo) — a transação faz rollback automático
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Estoque insuficiente para "%" — tente novamente', v_item.name;
    END IF;
  END LOOP;

  -- ──────────────────────────────────────────────────────────
  -- 8. INCREMENTAR USO DO CUPOM
  -- ──────────────────────────────────────────────────────────

  IF v_coupon.id IS NOT NULL THEN
    UPDATE public.coupons
    SET usage_count = usage_count + 1
    WHERE id = v_coupon.id;
  END IF;

  -- ──────────────────────────────────────────────────────────
  -- 9. RETORNAR DADOS PARA O FRONTEND
  -- ──────────────────────────────────────────────────────────

  RETURN jsonb_build_object(
    'order_code', v_order_code,
    'order_id',   v_order_id,
    'subtotal',   v_subtotal,
    'discount',   v_discount,
    'total',      v_total
  );

END;
$$;

-- ──────────────────────────────────────────────────────────
-- PERMISSÕES
-- Conceder para authenticated E anon (guest checkout)
-- A função é SECURITY DEFINER: executa com os privilégios do
-- owner (postgres), então não precisa de GRANTs nas tabelas
-- ──────────────────────────────────────────────────────────

GRANT EXECUTE ON FUNCTION public.create_order(
  JSONB, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, UUID
) TO anon, authenticated;

-- ──────────────────────────────────────────────────────────
-- REVOGAR funções antigas que eram chamadas diretamente
-- (agora tudo passa pelo create_order)
-- ──────────────────────────────────────────────────────────

REVOKE EXECUTE ON FUNCTION public.decrement_inventory(UUID, INT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_coupon_usage(UUID) FROM anon;
-- validate_coupon ainda pode ficar para anon (só lê, não modifica)
-- mas process_order_inventory_and_coupon não é mais necessária diretamente
REVOKE EXECUTE ON FUNCTION public.process_order_inventory_and_coupon(JSONB, UUID) FROM anon;
