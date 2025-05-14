-- Enable Row Level Security for all tables
ALTER TABLE roster_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE extras_personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_systems ENABLE ROW LEVEL SECURITY;

-- Create a function to check if the request is from admin upload page
CREATE OR REPLACE FUNCTION is_admin_upload()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the request comes from the admin upload page
  -- This is determined by the presence of the admin PIN in the request
  RETURN (current_setting('request.headers')::json->>'x-admin-pin') = '7954';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Roster Data Policies
CREATE POLICY "Allow read access to roster_data for all"
ON roster_data FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Allow write access to roster_data for admin only"
ON roster_data FOR INSERT
TO authenticated, anon
WITH CHECK (is_admin_upload());

CREATE POLICY "Allow update access to roster_data for admin only"
ON roster_data FOR UPDATE
TO authenticated, anon
USING (is_admin_upload());

CREATE POLICY "Allow delete access to roster_data for admin only"
ON roster_data FOR DELETE
TO authenticated, anon
USING (is_admin_upload());

-- Extras Personnel Policies
CREATE POLICY "Allow read access to extras_personnel for all"
ON extras_personnel FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Allow write access to extras_personnel for admin only"
ON extras_personnel FOR INSERT
TO authenticated, anon
WITH CHECK (is_admin_upload());

CREATE POLICY "Allow update access to extras_personnel for admin only"
ON extras_personnel FOR UPDATE
TO authenticated, anon
USING (is_admin_upload());

CREATE POLICY "Allow delete access to extras_personnel for admin only"
ON extras_personnel FOR DELETE
TO authenticated, anon
USING (is_admin_upload());

-- Point Systems Policies
CREATE POLICY "Allow read access to point_systems for all"
ON point_systems FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Allow write access to point_systems for admin only"
ON point_systems FOR INSERT
TO authenticated, anon
WITH CHECK (is_admin_upload());

CREATE POLICY "Allow update access to point_systems for admin only"
ON point_systems FOR UPDATE
TO authenticated, anon
USING (is_admin_upload());

CREATE POLICY "Allow delete access to point_systems for admin only"
ON point_systems FOR DELETE
TO authenticated, anon
USING (is_admin_upload()); 