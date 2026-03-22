
CREATE OR REPLACE FUNCTION public.ensure_financial_defaults()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_owner uuid := auth.uid();
  v_has_cats boolean;
  v_has_ccs boolean;
BEGIN
  IF v_owner IS NULL THEN RETURN; END IF;

  SELECT EXISTS (SELECT 1 FROM public.financial_categories WHERE owner_user_id = v_owner LIMIT 1) INTO v_has_cats;
  SELECT EXISTS (SELECT 1 FROM public.cost_centers WHERE owner_user_id = v_owner LIMIT 1) INTO v_has_ccs;

  IF NOT v_has_cats THEN
    INSERT INTO public.financial_categories (name, type, owner_user_id) VALUES
      ('Venda de Produto', 'income', v_owner),
      ('Recebimento de Fiado', 'income', v_owner),
      ('Recebimento de Cartão', 'income', v_owner),
      ('Recebimento de Boleto', 'income', v_owner),
      ('Recebimento PIX', 'income', v_owner),
      ('Compra de Mercadoria', 'expense', v_owner),
      ('Frete', 'expense', v_owner),
      ('Embalagem', 'expense', v_owner),
      ('Marketing', 'expense', v_owner),
      ('Taxa de Plataforma', 'expense', v_owner),
      ('Taxa de Cartão', 'expense', v_owner),
      ('Despesa Operacional', 'expense', v_owner),
      ('Retirada / Pró-labore', 'expense', v_owner),
      ('Outros', 'both', v_owner)
    ON CONFLICT DO NOTHING;
  END IF;

  IF NOT v_has_ccs THEN
    INSERT INTO public.cost_centers (name, owner_user_id) VALUES
      ('Loja Física', v_owner),
      ('E-commerce', v_owner),
      ('WhatsApp', v_owner),
      ('Porta a Porta', v_owner),
      ('Marketplace', v_owner),
      ('Administrativo', v_owner),
      ('Estoque', v_owner),
      ('Marketing', v_owner)
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;
