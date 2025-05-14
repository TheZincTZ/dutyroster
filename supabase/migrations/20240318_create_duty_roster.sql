-- Create the duty_roster table
CREATE TABLE IF NOT EXISTS public.duty_roster (
    id BIGSERIAL PRIMARY KEY,
    date INTEGER NOT NULL,
    AM TEXT,
    PM TEXT,
    ReserveAM TEXT,
    ReservePM TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_duty_roster_date ON public.duty_roster(date);

-- Enable Row Level Security (RLS)
ALTER TABLE public.duty_roster ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.duty_roster
    FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.duty_roster
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON public.duty_roster
    FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON public.duty_roster
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.duty_roster
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 