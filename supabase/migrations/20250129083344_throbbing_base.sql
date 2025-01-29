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

-- Safely create policies
DO $$ 
BEGIN
    -- Check and create policy for storage.objects
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Give users access to own folder'
    ) THEN
        CREATE POLICY "Give users access to own folder" ON storage.objects
        FOR ALL USING (
            auth.uid()::text = (storage.foldername(name))[1]
            AND bucket_id = 'verifications'
        );
    END IF;

    -- Check and create policy for bucket creation
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'buckets' 
        AND schemaname = 'storage' 
        AND policyname = 'Allow authenticated users to create buckets'
    ) THEN
        CREATE POLICY "Allow authenticated users to create buckets" ON storage.buckets
        FOR INSERT TO authenticated
        WITH CHECK (true);
    END IF;

    -- Check and create policy for bucket reading
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'buckets' 
        AND schemaname = 'storage' 
        AND policyname = 'Allow authenticated users to read own bucket'
    ) THEN
        CREATE POLICY "Allow authenticated users to read own bucket" ON storage.buckets
        FOR SELECT TO authenticated
        USING (true);
    END IF;
END $$;

-- Create helper function for folder name extraction if it doesn't exist
CREATE OR REPLACE FUNCTION storage.foldername(name text)
RETURNS text[] LANGUAGE plpgsql AS $$
DECLARE
  _parts text[];
BEGIN
  SELECT string_to_array(name, '/') INTO _parts;
  RETURN _parts;
END $$;