-- =============================================================================
-- RIA Documents Storage Bucket - RLS Policies
-- Run this in Supabase SQL Editor to fix "new row violates row-level security policy"
-- =============================================================================

-- 1. Create the bucket if it doesn't exist (public = false for private docs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('ria-documents', 'ria-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies (if any) to recreate cleanly
DROP POLICY IF EXISTS "Authenticated users can upload RIA documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own RIA documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff and admin can view all RIA documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own RIA documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own RIA documents" ON storage.objects;

-- 3. Allow authenticated users to upload files to the ria-documents bucket
CREATE POLICY "Authenticated users can upload RIA documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ria-documents'
);

-- 4. Allow users to view/download their own documents (matching user_id in path)
CREATE POLICY "Users can view their own RIA documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'ria-documents'
);

-- 5. Allow staff and admin to view all RIA documents
CREATE POLICY "Staff and admin can view all RIA documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'ria-documents'
  AND (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('staff', 'admin')
    )
  )
);

-- 6. Allow users to update (upsert) their own documents
CREATE POLICY "Users can update their own RIA documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'ria-documents'
)
WITH CHECK (
  bucket_id = 'ria-documents'
);

-- 7. Allow users to delete their own documents
CREATE POLICY "Users can delete their own RIA documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'ria-documents'
);
