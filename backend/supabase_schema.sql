-- Create documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Document',
  content JSONB DEFAULT '{}',
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);

-- Create index on updated_at for sorting recent documents
CREATE INDEX IF NOT EXISTS idx_documents_updated_at ON public.documents(updated_at DESC);

-- Create index on is_deleted for filtering
CREATE INDEX IF NOT EXISTS idx_documents_is_deleted ON public.documents(is_deleted);

-- Enable Row Level Security
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own documents
CREATE POLICY "Users can read their own documents" ON public.documents
  FOR SELECT
  USING (true);

-- Create policy to allow users to insert their own documents
CREATE POLICY "Users can insert their own documents" ON public.documents
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow users to update their own documents
CREATE POLICY "Users can update their own documents" ON public.documents
  FOR UPDATE
  USING (true);

-- Create policy to allow users to delete their own documents
CREATE POLICY "Users can delete their own documents" ON public.documents
  FOR DELETE
  USING (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to update updated_at on every update
DROP TRIGGER IF EXISTS update_documents_updated_at ON public.documents;
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();