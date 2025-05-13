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
    // Try to insert a test record to check if table exists
    const { error: insertError } = await supabase
      .from('roster')
      .insert({
        date: 'test',
        am: 'test',
        pm: 'test',
        reserve_am: 'test',
        reserve_pm: 'test'
      })
      .select();

    if (insertError) {
      console.error('Error checking table:', insertError);
      // If the error is about the table not existing, we'll handle it in the UI
      return false;
    }

    // If we get here, the table exists and we can delete the test record
    const { error: deleteError } = await supabase
      .from('roster')
      .delete()
      .eq('date', 'test');

    if (deleteError) {
      console.error('Error deleting test record:', deleteError);
    }

    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
} 