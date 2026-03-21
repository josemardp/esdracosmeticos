-- Revoke anon execution access to critical functions
-- These functions should only be called by authenticated users or service role if needed
-- However, since the checkout might need them for guests, we need to ensure they are safe
-- For now, revoking as requested to prevent direct manipulation

REVOKE EXECUTE ON FUNCTION public.decrement_inventory(JSONB) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_coupon_usage(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_order_inventory_and_coupon(JSONB, UUID) FROM anon;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.decrement_inventory(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_coupon_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_order_inventory_and_coupon(JSONB, UUID) TO authenticated;

-- Note: If guest checkout is allowed, the client might still need to call these
-- but they should be restricted by other means or only accessible via authenticated session if possible.
-- The user requested to block anonymous execution.
