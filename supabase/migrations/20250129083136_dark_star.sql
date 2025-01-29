-- Create storage schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS storage;

-- Create the verifications bucket
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'verifications',
    'verifications',
    false,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'application/pdf']::text[]
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'application/pdf']::text[];
END $$;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
    -- Drop policies on storage.objects
    DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;
    
    -- Drop policies on storage.buckets
    DROP POLICY IF EXISTS "Allow authenticated users to create buckets" ON storage.buckets;
    DROP POLICY IF EXISTS "Allow authenticated users to read own bucket" ON storage.buckets;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Bucket Policies
CREATE POLICY "Give users access to own folder" ON storage.objects
FOR ALL USING (
  auth.uid()::text = (storage.foldername(name))[1]
  AND bucket_id = 'verifications'
);

-- Allow users to create buckets
CREATE POLICY "Allow authenticated users to create buckets" ON storage.buckets
FOR INSERT TO authenticated
WITH CHECK (true);

-- Allow users to read own bucket
CREATE POLICY "Allow authenticated users to read own bucket" ON storage.buckets
FOR SELECT TO authenticated
USING (true);

-- Create helper function for folder name extraction if it doesn't exist
CREATE OR REPLACE FUNCTION storage.foldername(name text)
RETURNS text[] LANGUAGE plpgsql AS $$
DECLARE
  _parts text[];
BEGIN
  SELECT string_to_array(name, '/') INTO _parts;
  RETURN _parts;
END $$;