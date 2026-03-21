
DROP POLICY "Public insert abandoned carts" ON public.abandoned_carts;
CREATE POLICY "Public insert abandoned carts" ON public.abandoned_carts FOR INSERT TO public WITH CHECK (email IS NOT NULL AND length(email) > 3);
