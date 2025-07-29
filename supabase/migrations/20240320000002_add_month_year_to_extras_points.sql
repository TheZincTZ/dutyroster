-- Add month and year columns to extras_personnel table
ALTER TABLE extras_personnel ADD COLUMN IF NOT EXISTS month VARCHAR(20);
ALTER TABLE extras_personnel ADD COLUMN IF NOT EXISTS year INTEGER;

-- Add month and year columns to point_systems table
ALTER TABLE point_systems ADD COLUMN IF NOT EXISTS month VARCHAR(20);
ALTER TABLE point_systems ADD COLUMN IF NOT EXISTS year INTEGER;

-- Create composite unique constraints to prevent duplicate entries for same name/month/year
ALTER TABLE extras_personnel DROP CONSTRAINT IF EXISTS unique_extras_name_month_year;
ALTER TABLE extras_personnel ADD CONSTRAINT unique_extras_name_month_year UNIQUE (name, month, year);

ALTER TABLE point_systems DROP CONSTRAINT IF EXISTS unique_points_name_month_year;
ALTER TABLE point_systems ADD CONSTRAINT unique_points_name_month_year UNIQUE (name, unit, shift, month, year);

-- Create indexes for better query performance when filtering by month/year
CREATE INDEX IF NOT EXISTS idx_extras_personnel_month_year ON extras_personnel(month, year);
CREATE INDEX IF NOT EXISTS idx_point_systems_month_year ON point_systems(month, year);

-- Update existing data to have current month/year (assuming existing data is for current month)
UPDATE extras_personnel 
SET month = LOWER(TO_CHAR(CURRENT_DATE, 'Month')), 
    year = EXTRACT(YEAR FROM CURRENT_DATE) 
WHERE month IS NULL OR year IS NULL;

UPDATE point_systems 
SET month = LOWER(TO_CHAR(CURRENT_DATE, 'Month')), 
    year = EXTRACT(YEAR FROM CURRENT_DATE) 
WHERE month IS NULL OR year IS NULL; 