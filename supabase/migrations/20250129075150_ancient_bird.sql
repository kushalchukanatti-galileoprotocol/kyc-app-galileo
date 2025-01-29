/*
  # Add Storage Policies

  1. Changes
    - Create storage bucket for verifications
    - Add policies for bucket access and file operations
    - Enable authenticated users to upload files
*/

-- Create the verifications bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('verifications', 'verifications', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to create buckets (needed for initial setup)
CREATE POLICY "Allow authenticated users to create buckets"
ON storage.buckets
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to upload files to their own verification folders
CREATE POLICY "Allow users to upload verification files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'verifications' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to read their own verification files
CREATE POLICY "Allow users to read their own verification files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'verifications' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own verification files
CREATE POLICY "Allow users to delete their own verification files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'verifications' AND
  (storage.foldername(name))[1] = auth.uid()::text
);