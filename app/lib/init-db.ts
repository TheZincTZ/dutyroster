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
    // Check if the roster table exists
    const { data: tableExists, error: tableCheckError } = await supabase
      .from('roster')
      .select('count')
      .limit(1);

    if (tableCheckError) {
      console.log('Table does not exist, creating it...');
      
      // Create the roster table
      const { error: createTableError } = await supabase.rpc('create_roster_table', {
        table_name: 'roster'
      });

      if (createTableError) {
        console.error('Error creating table:', createTableError);
        throw createTableError;
      }

      console.log('Table created successfully');
    } else {
      console.log('Table already exists');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
} 