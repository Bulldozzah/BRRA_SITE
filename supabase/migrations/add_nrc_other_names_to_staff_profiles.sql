-- Add nrc_number and other_names columns to staff_profiles table
ALTER TABLE public.staff_profiles
ADD COLUMN IF NOT EXISTS nrc_number TEXT,
ADD COLUMN IF NOT EXISTS other_names TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.staff_profiles.nrc_number IS 'National Registration Card number';
COMMENT ON COLUMN public.staff_profiles.other_names IS 'Other names (first name, middle names)';
