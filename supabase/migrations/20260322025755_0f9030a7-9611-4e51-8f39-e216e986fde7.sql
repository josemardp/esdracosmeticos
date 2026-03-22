
ALTER TABLE public.cash_movements
  ADD COLUMN financial_category_id uuid REFERENCES public.financial_categories(id),
  ADD COLUMN cost_center_id uuid REFERENCES public.cost_centers(id);
