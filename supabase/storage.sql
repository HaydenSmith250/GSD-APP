-- Create the storage bucket for task verification photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('verifications', 'verifications', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS (Row Level Security) policies for the bucket
-- Allow public read access to verifications
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'verifications' );

-- Allow public insert (authenticated via our API route)
CREATE POLICY "Public Insert" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'verifications' );

-- Allow public delete (for cleanup if needed)
CREATE POLICY "Public Delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'verifications' );
