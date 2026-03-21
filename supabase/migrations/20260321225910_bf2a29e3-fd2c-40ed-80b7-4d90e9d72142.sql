
CREATE OR REPLACE FUNCTION public.generate_order_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  next_num INT;
BEGIN
  -- Advisory lock prevents concurrent triggers from reading the same MAX value
  PERFORM pg_advisory_xact_lock(hashtext('generate_order_code'));

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
$function$;
