
-- ============================================================
-- ESDRA COSMÉTICOS — COMPLETE DATABASE SCHEMA
-- ============================================================

-- 1. ENUM FOR ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');

-- 2. PROFILES TABLE (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. USER ROLES TABLE (separate from profiles — security best practice)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. SECURITY DEFINER FUNCTION — has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 5. CATEGORIES
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 6. PRODUCTS
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sku TEXT UNIQUE,
  short_description TEXT,
  full_description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  sale_price NUMERIC(10,2),
  inventory_count INT NOT NULL DEFAULT 0,
  min_inventory INT NOT NULL DEFAULT 5,
  active BOOLEAN NOT NULL DEFAULT true,
  featured BOOLEAN NOT NULL DEFAULT false,
  new_arrival BOOLEAN NOT NULL DEFAULT false,
  bestseller BOOLEAN NOT NULL DEFAULT false,
  cover_image TEXT,
  gallery TEXT[] DEFAULT '{}',
  benefits TEXT,
  how_to_use TEXT,
  ingredients TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 7. CUSTOMERS
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- 8. ADDRESSES
CREATE TABLE public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  zip TEXT NOT NULL,
  street TEXT NOT NULL,
  number TEXT NOT NULL,
  complement TEXT,
  neighborhood TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  reference TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- 9. ORDERS
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  order_code TEXT NOT NULL UNIQUE,
  channel_origin TEXT NOT NULL DEFAULT 'website',
  external_order_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping_address_snapshot JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 10. ORDER ITEMS
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  name_snapshot TEXT NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 11. COUPONS
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'percentage',
  value NUMERIC(10,2) NOT NULL DEFAULT 0,
  min_order NUMERIC(10,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  usage_limit INT,
  usage_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- 12. REVIEWS
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 13. FAVORITES
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (customer_id, product_id)
);
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- 14. SUPPORT TICKETS
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'website',
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- 15. MARKETPLACE CONFIGS
CREATE TABLE public.marketplace_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT false,
  environment TEXT NOT NULL DEFAULT 'sandbox',
  credentials JSONB DEFAULT '{}',
  connection_status TEXT NOT NULL DEFAULT 'disconnected',
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.marketplace_configs ENABLE ROW LEVEL SECURITY;

-- 16. PRODUCT CHANNEL MAPPINGS
CREATE TABLE public.product_channel_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  external_product_id TEXT,
  external_sku TEXT,
  active_on_channel BOOLEAN NOT NULL DEFAULT false,
  channel_price NUMERIC(10,2),
  channel_inventory INT,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.product_channel_mappings ENABLE ROW LEVEL SECURITY;

-- 17. INTEGRATION LOGS
CREATE TABLE public.integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL,
  event_type TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  status TEXT NOT NULL DEFAULT 'info',
  message TEXT,
  payload_summary JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Generate order code ESD-XXXX
CREATE OR REPLACE FUNCTION public.generate_order_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  next_num INT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_code FROM 5) AS INT)), 0) + 1
  INTO next_num
  FROM public.orders;
  NEW.order_code := 'ESD-' || LPAD(next_num::TEXT, 5, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_order_code
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.order_code IS NULL OR NEW.order_code = '')
  EXECUTE FUNCTION public.generate_order_code();

-- Decrement inventory atomically (prevents negative stock)
CREATE OR REPLACE FUNCTION public.decrement_inventory(p_product_id UUID, p_qty INT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.products
  SET inventory_count = inventory_count - p_qty,
      updated_at = now()
  WHERE id = p_product_id
    AND inventory_count >= p_qty;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Estoque insuficiente para o produto %', p_product_id;
  END IF;
END;
$$;

-- Validate coupon
CREATE OR REPLACE FUNCTION public.validate_coupon(p_code TEXT, p_order_total NUMERIC)
RETURNS TABLE(coupon_id UUID, discount_value NUMERIC)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  c RECORD;
BEGIN
  SELECT * INTO c FROM public.coupons
  WHERE code = UPPER(p_code) AND active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cupom inválido';
  END IF;
  
  IF c.starts_at IS NOT NULL AND now() < c.starts_at THEN
    RAISE EXCEPTION 'Cupom ainda não está ativo';
  END IF;
  
  IF c.ends_at IS NOT NULL AND now() > c.ends_at THEN
    RAISE EXCEPTION 'Cupom expirado';
  END IF;
  
  IF c.usage_limit IS NOT NULL AND c.usage_count >= c.usage_limit THEN
    RAISE EXCEPTION 'Cupom esgotado';
  END IF;
  
  IF p_order_total < c.min_order THEN
    RAISE EXCEPTION 'Valor mínimo do pedido não atingido: R$ %', c.min_order;
  END IF;
  
  IF c.type = 'percentage' THEN
    RETURN QUERY SELECT c.id, ROUND(p_order_total * c.value / 100, 2);
  ELSE
    RETURN QUERY SELECT c.id, LEAST(c.value, p_order_total);
  END IF;
END;
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''));
  
  -- Default role: customer
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_marketplace_configs_updated_at BEFORE UPDATE ON public.marketplace_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- PROFILES
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Admins read all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- USER ROLES
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- CATEGORIES
CREATE POLICY "Public read active categories" ON public.categories FOR SELECT USING (active = true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- PRODUCTS
CREATE POLICY "Public read active products" ON public.products FOR SELECT USING (active = true);
CREATE POLICY "Admins manage products" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- CUSTOMERS
CREATE POLICY "Customers read own data" ON public.customers FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Customers update own data" ON public.customers FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Customers insert own data" ON public.customers FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins read all customers" ON public.customers FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ADDRESSES
CREATE POLICY "Customers manage own addresses" ON public.addresses FOR ALL TO authenticated USING (
  customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
);
CREATE POLICY "Admins read all addresses" ON public.addresses FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ORDERS
CREATE POLICY "Customers read own orders" ON public.orders FOR SELECT TO authenticated USING (
  customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
);
CREATE POLICY "Customers create orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (
  customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
);
CREATE POLICY "Admins manage orders" ON public.orders FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ORDER ITEMS
CREATE POLICY "Customers read own order items" ON public.order_items FOR SELECT TO authenticated USING (
  order_id IN (SELECT id FROM public.orders WHERE customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid()))
);
CREATE POLICY "Customers insert order items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (
  order_id IN (SELECT id FROM public.orders WHERE customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid()))
);
CREATE POLICY "Admins manage order items" ON public.order_items FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- COUPONS
CREATE POLICY "Admins manage coupons" ON public.coupons FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated validate coupons" ON public.coupons FOR SELECT TO authenticated USING (active = true);

-- REVIEWS
CREATE POLICY "Public read approved reviews" ON public.reviews FOR SELECT USING (approved = true);
CREATE POLICY "Customers create reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (
  customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
);
CREATE POLICY "Admins manage reviews" ON public.reviews FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- FAVORITES
CREATE POLICY "Customers manage own favorites" ON public.favorites FOR ALL TO authenticated USING (
  customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
);

-- SUPPORT TICKETS
CREATE POLICY "Anyone can create tickets" ON public.support_tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins manage tickets" ON public.support_tickets FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- MARKETPLACE CONFIGS (admin only)
CREATE POLICY "Admins manage marketplace configs" ON public.marketplace_configs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- PRODUCT CHANNEL MAPPINGS (admin only)
CREATE POLICY "Admins manage channel mappings" ON public.product_channel_mappings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- INTEGRATION LOGS (admin only)
CREATE POLICY "Admins read integration logs" ON public.integration_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert integration logs" ON public.integration_logs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies
CREATE POLICY "Public read product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Admins upload product images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete product images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public read banners" ON storage.objects FOR SELECT USING (bucket_id = 'banners');
CREATE POLICY "Admins upload banners" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'banners' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete banners" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'banners' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users read own avatar" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Users delete own avatar" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars');

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_active ON public.products(active);
CREATE INDEX idx_orders_customer ON public.orders(customer_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_customers_user ON public.customers(user_id);
CREATE INDEX idx_favorites_customer ON public.favorites(customer_id);
CREATE INDEX idx_reviews_product ON public.reviews(product_id);
CREATE INDEX idx_integration_logs_channel ON public.integration_logs(channel);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
