
-- Fix any existing orders with empty order_code
DO $$
DECLARE
  r RECORD;
  i INT := 0;
BEGIN
  FOR r IN SELECT id FROM public.orders WHERE order_code IS NULL OR order_code = '' ORDER BY created_at
  LOOP
    i := i + 1;
    UPDATE public.orders SET order_code = 'ESD-' || LPAD(i::TEXT, 5, '0') WHERE id = r.id;
  END LOOP;
END;
$$;

-- Recreate the trigger function to handle edge cases
CREATE OR REPLACE FUNCTION public.generate_order_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  next_num INT;
BEGIN
  SELECT COALESCE(
    MAX(CAST(NULLIF(SUBSTRING(order_code FROM 5), '') AS INT)),
    0
  ) + 1
  INTO next_num
  FROM public.orders
  WHERE order_code ~ '^ESD-[0-9]+$';

  NEW.order_code := 'ESD-' || LPAD(next_num::TEXT, 5, '0');
  RETURN NEW;
END;
$$;

-- Create the BEFORE INSERT trigger
DROP TRIGGER IF EXISTS trg_generate_order_code ON public.orders;
CREATE TRIGGER trg_generate_order_code
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_order_code();
