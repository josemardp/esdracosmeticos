
-- Fix function search_path warnings
ALTER FUNCTION public.generate_order_code() SET search_path = public;
ALTER FUNCTION public.decrement_inventory(UUID, INT) SET search_path = public;
ALTER FUNCTION public.validate_coupon(TEXT, NUMERIC) SET search_path = public;
ALTER FUNCTION public.update_updated_at() SET search_path = public;

-- Fix permissive RLS: restrict support ticket inserts to require non-empty fields
DROP POLICY "Anyone can create tickets" ON public.support_tickets;
CREATE POLICY "Anyone can create tickets" ON public.support_tickets FOR INSERT WITH CHECK (
  length(name) > 0 AND length(email) > 3 AND length(message) > 0
);
