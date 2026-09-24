
-- Atomic RPC for registering a receipt (payment received)
CREATE OR REPLACE FUNCTION public.register_receipt(
  p_title_id uuid,
  p_amount numeric DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_title RECORD;
  v_remaining numeric;
  v_pay numeric;
  v_cash_id uuid;
  v_owner uuid := auth.uid();
  v_receipt_id uuid;
BEGIN
  -- Lock and fetch the title
  SELECT * INTO v_title
  FROM public.receivable_titles
  WHERE id = p_title_id AND owner_user_id = v_owner
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Título não encontrado ou sem permissão';
  END IF;

  IF v_title.status = 'paid' THEN
    RAISE EXCEPTION 'Título já está pago';
  END IF;

  v_remaining := v_title.amount - v_title.paid_amount;
  IF v_remaining <= 0 THEN
    RAISE EXCEPTION 'Nenhum valor pendente neste título';
  END IF;

  v_pay := COALESCE(p_amount, v_remaining);
  IF v_pay > v_remaining THEN
    v_pay := v_remaining;
  END IF;
  IF v_pay <= 0 THEN
    RAISE EXCEPTION 'Valor de recebimento inválido';
  END IF;

  -- Ensure cash account exists
  SELECT id INTO v_cash_id
  FROM public.cash_accounts
  WHERE owner_user_id = v_owner AND active = true
  LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO public.cash_accounts (name, owner_user_id)
    VALUES ('Caixa Principal', v_owner)
    RETURNING id INTO v_cash_id;
  END IF;

  -- 1. Insert receipt
  INSERT INTO public.receivable_receipts (
    title_id, amount, receipt_date, cash_account_id, owner_user_id,
    payment_method_id
  ) VALUES (
    p_title_id, v_pay, CURRENT_DATE, v_cash_id, v_owner,
    v_title.payment_method_id
  ) RETURNING id INTO v_receipt_id;

  -- 2. Update title
  UPDATE public.receivable_titles
  SET paid_amount = paid_amount + v_pay,
      status = CASE
        WHEN (paid_amount + v_pay) >= amount THEN 'paid'
        ELSE 'pending'
      END
  WHERE id = p_title_id;

  -- 3. Insert cash movement
  INSERT INTO public.cash_movements (
    cash_account_id, type, amount, description,
    reference_type, reference_id, owner_user_id
  ) VALUES (
    v_cash_id, 'credit', v_pay,
    'Recebimento: ' || v_title.description,
    'receipt', v_receipt_id, v_owner
  );

  -- 4. Update cash account balance
  UPDATE public.cash_accounts
  SET balance = balance + v_pay
  WHERE id = v_cash_id;

  RETURN jsonb_build_object(
    'receipt_id', v_receipt_id,
    'amount', v_pay,
    'title_status', CASE WHEN (v_title.paid_amount + v_pay) >= v_title.amount THEN 'paid' ELSE 'pending' END
  );
END;
$$;

-- Grant execute to authenticated only
REVOKE ALL ON FUNCTION public.register_receipt(uuid, numeric) FROM public;
REVOKE ALL ON FUNCTION public.register_receipt(uuid, numeric) FROM anon;
GRANT EXECUTE ON FUNCTION public.register_receipt(uuid, numeric) TO authenticated;
