import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function initDatabase() {
  try {
    // Create the roster table if it doesn't exist
    const { error: createTableError } = await supabase.rpc('create_roster_table');
    
    if (createTableError) {
      console.error('Error creating table:', createTableError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
} 