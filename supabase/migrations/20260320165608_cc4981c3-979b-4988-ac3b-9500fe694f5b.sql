
-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read access for product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'products');

-- Allow authenticated users to upload
CREATE POLICY "Auth users can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');

-- Allow authenticated users to update
CREATE POLICY "Auth users can update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'products');

-- Allow authenticated users to delete
CREATE POLICY "Auth users can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'products');
