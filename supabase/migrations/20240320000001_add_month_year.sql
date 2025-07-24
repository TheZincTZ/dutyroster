-- Add month and year columns to roster_data table
ALTER TABLE roster_data ADD COLUMN IF NOT EXISTS month INTEGER;
ALTER TABLE roster_data ADD COLUMN IF NOT EXISTS year INTEGER;

-- Create a composite unique constraint to prevent duplicate entries for same date/month/year
ALTER TABLE roster_data DROP CONSTRAINT IF EXISTS unique_date_month_year;
ALTER TABLE roster_data ADD CONSTRAINT unique_date_month_year UNIQUE (date, month, year);

-- Create an index for better query performance when filtering by month/year
CREATE INDEX IF NOT EXISTS idx_roster_data_month_year ON roster_data(month, year);

-- Update existing data to have current month/year (assuming existing data is for current month)
UPDATE roster_data 
SET month = EXTRACT(MONTH FROM CURRENT_DATE), 
    year = EXTRACT(YEAR FROM CURRENT_DATE) 
WHERE month IS NULL OR year IS NULL; 