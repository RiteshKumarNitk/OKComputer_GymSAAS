-- Create a public storage bucket for tenant assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('tenants-public', 'tenants-public', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'tenants-public' );

-- Policy: Allow authenticated users to upload
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'tenants-public' AND
  auth.role() = 'authenticated'
);

-- Policy: Allow users to update their own uploads (optional, but good for edits)
CREATE POLICY "Owner Update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'tenants-public' AND
  auth.uid() = owner
);

-- Add owner_photo_url to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS owner_photo_url TEXT;

