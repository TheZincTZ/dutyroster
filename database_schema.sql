-- Add month and year columns to roster_data table
ALTER TABLE roster_data ADD COLUMN IF NOT EXISTS month VARCHAR(20);
ALTER TABLE roster_data ADD COLUMN IF NOT EXISTS year INTEGER;

-- Add month and year columns to extras_personnel table
ALTER TABLE extras_personnel ADD COLUMN IF NOT EXISTS month VARCHAR(20);
ALTER TABLE extras_personnel ADD COLUMN IF NOT EXISTS year INTEGER;

-- Add month and year columns to point_systems table
ALTER TABLE point_systems ADD COLUMN IF NOT EXISTS month VARCHAR(20);
ALTER TABLE point_systems ADD COLUMN IF NOT EXISTS year INTEGER; 