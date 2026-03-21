
-- Abandoned carts table for future automation
CREATE TABLE public.abandoned_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  email TEXT,
  phone TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  recovered BOOLEAN NOT NULL DEFAULT false,
  recovered_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage abandoned carts" ON public.abandoned_carts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Public insert abandoned carts" ON public.abandoned_carts FOR INSERT TO public WITH CHECK (true);

-- Stock alerts log for future automation
CREATE TABLE public.stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  alert_type TEXT NOT NULL DEFAULT 'low_stock',
  threshold INTEGER NOT NULL DEFAULT 5,
  notified BOOLEAN NOT NULL DEFAULT false,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage stock alerts" ON public.stock_alerts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Newsletter subscribers for future communication
CREATE TABLE public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  source TEXT NOT NULL DEFAULT 'footer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage newsletter" ON public.newsletter_subscribers FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Public subscribe newsletter" ON public.newsletter_subscribers FOR INSERT TO public WITH CHECK (length(email) > 3);
