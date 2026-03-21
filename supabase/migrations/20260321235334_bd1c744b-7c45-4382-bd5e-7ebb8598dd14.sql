
-- =============================================
-- Fase 1: Núcleo comercial e financeiro
-- =============================================

-- 1. sales_channels (referência)
CREATE TABLE public.sales_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active channels" ON public.sales_channels FOR SELECT TO public USING (active = true);
CREATE POLICY "Admins manage channels" ON public.sales_channels FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 2. payment_methods (referência)
CREATE TABLE public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  allows_installments boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active methods" ON public.payment_methods FOR SELECT TO public USING (active = true);
CREATE POLICY "Admins manage methods" ON public.payment_methods FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 3. cash_accounts
CREATE TABLE public.cash_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Caixa Principal',
  owner_user_id uuid NOT NULL,
  balance numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cash_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages cash accounts" ON public.cash_accounts FOR ALL TO authenticated USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());

-- 4. sales
CREATE TABLE public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_code text NOT NULL DEFAULT '',
  customer_id uuid REFERENCES public.customers(id),
  customer_name text NOT NULL DEFAULT '',
  channel_id uuid NOT NULL REFERENCES public.sales_channels(id),
  payment_method_id uuid NOT NULL REFERENCES public.payment_methods(id),
  subtotal numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  installments integer NOT NULL DEFAULT 1,
  notes text,
  status text NOT NULL DEFAULT 'completed',
  sale_date timestamptz NOT NULL DEFAULT now(),
  owner_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages sales" ON public.sales FOR ALL TO authenticated USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());

-- 5. sale_items
CREATE TABLE public.sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id),
  name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  subtotal numeric NOT NULL DEFAULT 0
);

ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages sale items" ON public.sale_items FOR ALL TO authenticated
  USING (sale_id IN (SELECT id FROM public.sales WHERE owner_user_id = auth.uid()))
  WITH CHECK (sale_id IN (SELECT id FROM public.sales WHERE owner_user_id = auth.uid()));

-- 6. receivable_titles
CREATE TABLE public.receivable_titles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES public.sales(id),
  order_id uuid REFERENCES public.orders(id),
  customer_id uuid REFERENCES public.customers(id),
  description text NOT NULL DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  paid_amount numeric NOT NULL DEFAULT 0,
  due_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'pending',
  installment_number integer NOT NULL DEFAULT 1,
  total_installments integer NOT NULL DEFAULT 1,
  payment_method_id uuid REFERENCES public.payment_methods(id),
  owner_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.receivable_titles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages receivable titles" ON public.receivable_titles FOR ALL TO authenticated USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());

-- 7. receivable_receipts
CREATE TABLE public.receivable_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id uuid NOT NULL REFERENCES public.receivable_titles(id),
  amount numeric NOT NULL,
  receipt_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method_id uuid REFERENCES public.payment_methods(id),
  cash_account_id uuid REFERENCES public.cash_accounts(id),
  notes text,
  owner_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.receivable_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages receipts" ON public.receivable_receipts FOR ALL TO authenticated USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());

-- 8. cash_movements
CREATE TABLE public.cash_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cash_account_id uuid NOT NULL REFERENCES public.cash_accounts(id),
  type text NOT NULL DEFAULT 'credit',
  amount numeric NOT NULL DEFAULT 0,
  description text NOT NULL DEFAULT '',
  reference_type text,
  reference_id uuid,
  movement_date timestamptz NOT NULL DEFAULT now(),
  owner_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages cash movements" ON public.cash_movements FOR ALL TO authenticated USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());

-- 9. order_financial_links
CREATE TABLE public.order_financial_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id),
  receivable_title_id uuid REFERENCES public.receivable_titles(id),
  cash_movement_id uuid REFERENCES public.cash_movements(id),
  owner_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_financial_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages order links" ON public.order_financial_links FOR ALL TO authenticated USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());

-- 10. Trigger for sale_code generation
CREATE OR REPLACE FUNCTION public.generate_sale_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  next_num INT;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('generate_sale_code'));
  SELECT COALESCE(
    MAX(CAST(NULLIF(SUBSTRING(sale_code FROM 3), '') AS INT)),
    0
  ) + 1
  INTO next_num
  FROM public.sales
  WHERE sale_code ~ '^V-[0-9]+$';
  NEW.sale_code := 'V-' || LPAD(next_num::TEXT, 5, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_sale_code
BEFORE INSERT ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.generate_sale_code();

-- 11. create_sale RPC
CREATE OR REPLACE FUNCTION public.create_sale(
  p_items jsonb,
  p_customer_name text,
  p_customer_id uuid DEFAULT NULL,
  p_channel_slug text DEFAULT 'manual',
  p_payment_slug text DEFAULT 'dinheiro',
  p_installments integer DEFAULT 1,
  p_discount numeric DEFAULT 0,
  p_notes text DEFAULT NULL,
  p_sale_date timestamptz DEFAULT now()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sale_id uuid;
  v_sale_code text;
  v_channel_id uuid;
  v_payment_id uuid;
  v_allows_inst boolean;
  v_subtotal numeric := 0;
  v_total numeric := 0;
  v_item jsonb;
  v_cash_id uuid;
  v_title_id uuid;
  v_inst_amount numeric;
  v_this_amount numeric;
  v_due date;
  v_owner uuid := auth.uid();
BEGIN
  -- Resolve channel
  SELECT id INTO v_channel_id FROM public.sales_channels WHERE slug = p_channel_slug AND active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'Canal não encontrado: %', p_channel_slug; END IF;

  -- Resolve payment method
  SELECT id, allows_installments INTO v_payment_id, v_allows_inst
  FROM public.payment_methods WHERE slug = p_payment_slug AND active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'Método de pagamento não encontrado: %', p_payment_slug; END IF;

  IF NOT v_allows_inst THEN p_installments := 1; END IF;

  -- Calculate subtotal from items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_subtotal := v_subtotal + ((v_item->>'qty')::int * (v_item->>'price')::numeric);
  END LOOP;

  v_total := v_subtotal - p_discount;
  IF v_total < 0 THEN v_total := 0; END IF;

  -- Create sale
  INSERT INTO public.sales (customer_id, customer_name, channel_id, payment_method_id, subtotal, discount, total, installments, notes, sale_date, owner_user_id)
  VALUES (p_customer_id, p_customer_name, v_channel_id, v_payment_id, v_subtotal, p_discount, v_total, p_installments, p_notes, p_sale_date, v_owner)
  RETURNING id, sale_code INTO v_sale_id, v_sale_code;

  -- Insert items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.sale_items (sale_id, product_id, name, quantity, unit_price, subtotal)
    VALUES (
      v_sale_id,
      CASE WHEN v_item->>'product_id' IS NOT NULL AND v_item->>'product_id' <> '' THEN (v_item->>'product_id')::uuid ELSE NULL END,
      v_item->>'name',
      (v_item->>'qty')::int,
      (v_item->>'price')::numeric,
      (v_item->>'qty')::int * (v_item->>'price')::numeric
    );
  END LOOP;

  -- Ensure cash account exists
  SELECT id INTO v_cash_id FROM public.cash_accounts WHERE owner_user_id = v_owner AND active = true LIMIT 1;
  IF NOT FOUND THEN
    INSERT INTO public.cash_accounts (name, owner_user_id) VALUES ('Caixa Principal', v_owner) RETURNING id INTO v_cash_id;
  END IF;

  -- Create receivable titles (one per installment)
  v_inst_amount := ROUND(v_total / p_installments, 2);

  FOR i IN 1..p_installments LOOP
    v_due := CURRENT_DATE + ((i - 1) * 30);
    v_this_amount := CASE WHEN i = p_installments THEN v_total - (v_inst_amount * (p_installments - 1)) ELSE v_inst_amount END;

    INSERT INTO public.receivable_titles (
      sale_id, customer_id, description, amount, paid_amount, due_date,
      installment_number, total_installments, payment_method_id, owner_user_id,
      status
    ) VALUES (
      v_sale_id, p_customer_id,
      CASE WHEN p_installments = 1 THEN 'Venda ' || v_sale_code
           ELSE 'Venda ' || v_sale_code || ' (' || i || '/' || p_installments || ')'
      END,
      v_this_amount, 0, v_due, i, p_installments, v_payment_id, v_owner,
      'pending'
    ) RETURNING id INTO v_title_id;

    -- Immediate payment for dinheiro/pix/débito (only 1 installment)
    IF p_payment_slug IN ('dinheiro', 'pix', 'cartao-debito') THEN
      UPDATE public.receivable_titles SET status = 'paid', paid_amount = v_this_amount WHERE id = v_title_id;

      INSERT INTO public.receivable_receipts (title_id, amount, receipt_date, payment_method_id, cash_account_id, owner_user_id)
      VALUES (v_title_id, v_this_amount, CURRENT_DATE, v_payment_id, v_cash_id, v_owner);

      INSERT INTO public.cash_movements (cash_account_id, type, amount, description, reference_type, reference_id, movement_date, owner_user_id)
      VALUES (v_cash_id, 'credit', v_this_amount, 'Recebimento: Venda ' || v_sale_code, 'sale', v_sale_id, p_sale_date, v_owner);

      UPDATE public.cash_accounts SET balance = balance + v_this_amount WHERE id = v_cash_id;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('sale_id', v_sale_id, 'sale_code', v_sale_code, 'total', v_total, 'installments', p_installments);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_sale TO authenticated;

-- 12. Seeds
INSERT INTO public.sales_channels (name, slug) VALUES
  ('Site', 'site'),
  ('Loja Física', 'loja-fisica'),
  ('Porta a Porta', 'porta-a-porta'),
  ('WhatsApp', 'whatsapp'),
  ('Marketplace', 'marketplace'),
  ('Manual', 'manual')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.payment_methods (name, slug, allows_installments) VALUES
  ('Dinheiro', 'dinheiro', false),
  ('PIX', 'pix', false),
  ('Cartão de Crédito', 'cartao-credito', true),
  ('Cartão de Débito', 'cartao-debito', false),
  ('Boleto', 'boleto', true),
  ('Fiado', 'fiado', true)
ON CONFLICT (slug) DO NOTHING;
