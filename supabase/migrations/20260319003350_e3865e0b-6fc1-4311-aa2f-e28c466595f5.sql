-- Allow guest checkout: public can insert customers (for guest orders)
CREATE POLICY "Public insert customers for guest checkout" ON public.customers
  FOR INSERT TO public
  WITH CHECK (user_id IS NULL AND length(name) > 0 AND length(email) > 3);

-- Allow guest checkout: public can insert orders  
CREATE POLICY "Public insert guest orders" ON public.orders
  FOR INSERT TO public
  WITH CHECK (customer_id IS NOT NULL);

-- Allow public to insert order items linked to orders
CREATE POLICY "Public insert guest order items" ON public.order_items
  FOR INSERT TO public
  WITH CHECK (order_id IS NOT NULL);

-- Function to increment coupon usage
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(p_coupon_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.coupons 
  SET usage_count = usage_count + 1
  WHERE id = p_coupon_id;
END;
$$;

-- Allow public to call decrement_inventory (needed for guest checkout)
GRANT EXECUTE ON FUNCTION public.decrement_inventory(uuid, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_coupon_usage(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric) TO anon;
