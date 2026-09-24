-- Remove anon INSERT bypass on orders
DROP POLICY IF EXISTS "Public insert guest orders" ON public.orders;

-- Remove anon INSERT bypass on order_items
DROP POLICY IF EXISTS "Public insert guest order items" ON public.order_items;

-- Add unique constraint on newsletter email to handle duplicates gracefully
ALTER TABLE public.newsletter_subscribers ADD CONSTRAINT newsletter_subscribers_email_unique UNIQUE (email);

-- Create trigger function to update customer stats after order insert
CREATE OR REPLACE FUNCTION public.update_customer_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.customers
  SET order_count = COALESCE(order_count, 0) + 1,
      total_spent = COALESCE(total_spent, 0) + NEW.total,
      last_order_at = NEW.created_at,
      updated_at = now()
  WHERE id = NEW.customer_id;
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trg_update_customer_stats ON public.orders;
CREATE TRIGGER trg_update_customer_stats
  AFTER INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.customer_id IS NOT NULL)
  EXECUTE FUNCTION public.update_customer_stats();