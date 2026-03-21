-- Create a sequence for order codes
CREATE SEQUENCE IF NOT EXISTS public.order_code_seq START WITH 1;

-- Adjust sequence to match current max order_code
DO $$
DECLARE
    max_val INT;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_code FROM 5) AS INT)), 0) INTO max_val FROM public.orders;
    PERFORM setval('public.order_code_seq', GREATEST(max_val, 1), true);
END $$;

-- Update the function to use nextval for atomicity
CREATE OR REPLACE FUNCTION public.generate_order_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Use sequence to ensure uniqueness and avoid race conditions
  NEW.order_code := 'ESD-' || LPAD(nextval('public.order_code_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remove the WHEN condition from the trigger to ensure it always runs if order_code is not provided or is empty
DROP TRIGGER IF EXISTS trg_generate_order_code ON public.orders;
CREATE TRIGGER trg_generate_order_code
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.order_code IS NULL OR NEW.order_code = '' OR NEW.order_code = 'TEMP')
  EXECUTE FUNCTION public.generate_order_code();
