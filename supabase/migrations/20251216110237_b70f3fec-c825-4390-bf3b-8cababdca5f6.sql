-- Storage policies for journey-photos bucket
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'journey-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'journey-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'journey-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Public read access (bucket is already public)
CREATE POLICY "Public read access for journey photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'journey-photos');