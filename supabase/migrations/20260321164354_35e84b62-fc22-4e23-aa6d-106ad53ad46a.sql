
-- Campaign banners table for seasonal campaigns & promotions
CREATE TABLE public.campaign_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT,
  link_url TEXT NOT NULL DEFAULT '/loja',
  badge_text TEXT,
  bg_color TEXT DEFAULT 'hsl(var(--primary))',
  text_color TEXT DEFAULT 'hsl(var(--primary-foreground))',
  position TEXT NOT NULL DEFAULT 'home_top',
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.campaign_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage campaign banners" ON public.campaign_banners FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Public read active campaign banners" ON public.campaign_banners FOR SELECT TO public USING (
  active = true 
  AND (starts_at IS NULL OR now() >= starts_at) 
  AND (ends_at IS NULL OR now() <= ends_at)
);

-- Add product tags for kits/combos/campaign classification
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS weight_volume TEXT;

-- Customer segmentation: last_order_at for quick segment queries
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS last_order_at TIMESTAMPTZ;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS order_count INTEGER DEFAULT 0;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS total_spent NUMERIC DEFAULT 0;
