
-- =============================================
-- FASE 2: Fornecedores, Compras, Contas a Pagar
-- =============================================

-- 1. SUPPLIERS
CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  document text,
  email text,
  phone text,
  contact_name text,
  notes text,
  active boolean NOT NULL DEFAULT true,
  owner_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages suppliers"
  ON public.suppliers FOR ALL TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

-- 2. PURCHASE ORDERS
CREATE TABLE public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_code text NOT NULL UNIQUE,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id),
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  discount numeric(12,2) NOT NULL DEFAULT 0,
  freight numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  installments integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'draft',
  order_date timestamptz NOT NULL DEFAULT now(),
  expected_delivery date,
  notes text,
  owner_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages purchase orders"
  ON public.purchase_orders FOR ALL TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

-- 3. PURCHASE ORDER ITEMS
CREATE TABLE public.purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id),
  name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_cost numeric(12,2) NOT NULL DEFAULT 0,
  subtotal numeric(12,2) NOT NULL DEFAULT 0
);

ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages PO items"
  ON public.purchase_order_items FOR ALL TO authenticated
  USING (purchase_order_id IN (
    SELECT id FROM public.purchase_orders WHERE owner_user_id = auth.uid()
  ))
  WITH CHECK (purchase_order_id IN (
    SELECT id FROM public.purchase_orders WHERE owner_user_id = auth.uid()
  ));

-- 4. PAYABLE TITLES
CREATE TABLE public.payable_titles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid REFERENCES public.purchase_orders(id),
  supplier_id uuid REFERENCES public.suppliers(id),
  description text NOT NULL DEFAULT '',
  amount numeric(12,2) NOT NULL DEFAULT 0,
  paid_amount numeric(12,2) NOT NULL DEFAULT 0,
  due_date date NOT NULL DEFAULT CURRENT_DATE,
  installment_number integer NOT NULL DEFAULT 1,
  total_installments integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending',
  owner_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payable_titles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages payable titles"
  ON public.payable_titles FOR ALL TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

-- 5. PAYABLE PAYMENTS
CREATE TABLE public.payable_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payable_title_id uuid NOT NULL REFERENCES public.payable_titles(id),
  amount numeric(12,2) NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  cash_account_id uuid REFERENCES public.cash_accounts(id),
  owner_user_id uuid NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payable_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages payable payments"
  ON public.payable_payments FOR ALL TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

-- 6. TRIGGER: generate po_code (PO-00001)
CREATE OR REPLACE FUNCTION public.generate_po_code()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
DECLARE
  next_num INT;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('generate_po_code'));
  SELECT COALESCE(
    MAX(CAST(NULLIF(SUBSTRING(po_code FROM 4), '') AS INT)),
    0
  ) + 1
  INTO next_num
  FROM public.purchase_orders
  WHERE po_code ~ '^PO-[0-9]+$';
  NEW.po_code := 'PO-' || LPAD(next_num::TEXT, 5, '0');
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_generate_po_code
  BEFORE INSERT ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_po_code();

-- 7. TRIGGER: updated_at for new tables
CREATE TRIGGER trg_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_purchase_orders_updated_at
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_payable_titles_updated_at
  BEFORE UPDATE ON public.payable_titles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 8. RPC: create_purchase_order (atomic)
CREATE OR REPLACE FUNCTION public.create_purchase_order(
  p_supplier_id uuid,
  p_items jsonb,
  p_installments integer DEFAULT 1,
  p_discount numeric DEFAULT 0,
  p_freight numeric DEFAULT 0,
  p_notes text DEFAULT NULL,
  p_order_date timestamptz DEFAULT now(),
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
  -- Validate supplier belongs to owner
  IF NOT EXISTS (SELECT 1 FROM public.suppliers WHERE id = p_supplier_id AND owner_user_id = v_owner AND active = true) THEN
    RAISE EXCEPTION 'Fornecedor não encontrado ou inativo';
  END IF;

  -- Calculate subtotal
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_subtotal := v_subtotal + ((v_item->>'qty')::int * (v_item->>'unit_cost')::numeric);
  END LOOP;

  v_total := v_subtotal - p_discount + p_freight;
  IF v_total < 0 THEN v_total := 0; END IF;

  -- Create PO (po_code generated by trigger)
  INSERT INTO public.purchase_orders (
    po_code, supplier_id, subtotal, discount, freight, total,
    installments, status, order_date, expected_delivery, notes, owner_user_id
  ) VALUES (
    '', p_supplier_id, v_subtotal, p_discount, p_freight, v_total,
    p_installments, 'confirmed', p_order_date, p_expected_delivery, p_notes, v_owner
  ) RETURNING id, po_code INTO v_po_id, v_po_code;

  -- Insert items
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

  -- Create payable titles (monthly due dates based on calendar months)
  v_inst_amount := ROUND(v_total / p_installments, 2);
  v_base_date := CURRENT_DATE;

  FOR i IN 1..p_installments LOOP
    -- Real monthly increment: add i-1 months to base date
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

-- 9. RPC: register_payment (atomic, mirrors register_receipt)
-- RULE: Payment is ALLOWED even if cash balance goes negative (overdraft).
-- Business rationale: real-world purchases happen regardless of cash on hand.
CREATE OR REPLACE FUNCTION public.register_payment(p_title_id uuid, p_amount numeric DEFAULT NULL)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_title RECORD;
  v_remaining numeric;
  v_pay numeric;
  v_cash_id uuid;
  v_owner uuid := auth.uid();
  v_payment_id uuid;
BEGIN
  -- Lock and fetch
  SELECT * INTO v_title
  FROM public.payable_titles
  WHERE id = p_title_id AND owner_user_id = v_owner
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Título não encontrado ou sem permissão';
  END IF;

  IF v_title.status = 'paid' THEN
    RAISE EXCEPTION 'Título já está pago';
  END IF;

  IF v_title.status = 'cancelled' THEN
    RAISE EXCEPTION 'Título cancelado não pode ser pago';
  END IF;

  v_remaining := v_title.amount - v_title.paid_amount;
  IF v_remaining <= 0 THEN
    RAISE EXCEPTION 'Nenhum valor pendente neste título';
  END IF;

  v_pay := COALESCE(p_amount, v_remaining);
  IF v_pay > v_remaining THEN v_pay := v_remaining; END IF;
  IF v_pay <= 0 THEN RAISE EXCEPTION 'Valor de pagamento inválido'; END IF;

  -- Ensure cash account
  SELECT id INTO v_cash_id
  FROM public.cash_accounts
  WHERE owner_user_id = v_owner AND active = true LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO public.cash_accounts (name, owner_user_id)
    VALUES ('Caixa Principal', v_owner) RETURNING id INTO v_cash_id;
  END IF;

  -- 1. Insert payment record
  INSERT INTO public.payable_payments (
    payable_title_id, amount, payment_date, cash_account_id, owner_user_id
  ) VALUES (
    p_title_id, v_pay, CURRENT_DATE, v_cash_id, v_owner
  ) RETURNING id INTO v_payment_id;

  -- 2. Update title
  UPDATE public.payable_titles
  SET paid_amount = paid_amount + v_pay,
      status = CASE
        WHEN (paid_amount + v_pay) >= amount THEN 'paid'
        ELSE 'partial'
      END
  WHERE id = p_title_id;

  -- 3. Cash movement (debit)
  INSERT INTO public.cash_movements (
    cash_account_id, type, amount, description,
    reference_type, reference_id, owner_user_id
  ) VALUES (
    v_cash_id, 'debit', v_pay,
    'Pagamento: ' || v_title.description,
    'payment', v_payment_id, v_owner
  );

  -- 4. Decrease cash balance (allows negative / overdraft)
  UPDATE public.cash_accounts
  SET balance = balance - v_pay
  WHERE id = v_cash_id;

  RETURN jsonb_build_object(
    'payment_id', v_payment_id,
    'amount', v_pay,
    'title_status', CASE WHEN (v_title.paid_amount + v_pay) >= v_title.amount THEN 'paid' ELSE 'partial' END
  );
END;
$function$;

-- 10. Grant RPCs to authenticated only
REVOKE ALL ON FUNCTION public.create_purchase_order(uuid, jsonb, integer, numeric, numeric, text, timestamptz, date) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_purchase_order(uuid, jsonb, integer, numeric, numeric, text, timestamptz, date) TO authenticated;

REVOKE ALL ON FUNCTION public.register_payment(uuid, numeric) FROM anon;
GRANT EXECUTE ON FUNCTION public.register_payment(uuid, numeric) TO authenticated;
