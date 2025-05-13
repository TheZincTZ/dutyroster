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

export type CalendarMap = {
  [key: string]: {
    AM: string;
    PM: string;
    ReserveAM: string;
    ReservePM: string;
  };
};

interface RosterRecord {
  id?: number;
  date: string;
  am: string;
  pm: string;
  reserve_am: string;
  reserve_pm: string;
}

export async function getRosterData(): Promise<CalendarMap> {
  try {
    const { data, error } = await supabase
      .from('roster')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching roster data:', error);
      return {};
    }

    // Process the data to get the latest entry for each date
    const calendarMap: CalendarMap = {};
    const processedDates = new Set<string>();

    data?.forEach((row) => {
      const date = String(row.date);
      // Only process each date once (taking the latest entry due to ordering)
      if (!processedDates.has(date)) {
        calendarMap[date] = {
          AM: row.am || '',
          PM: row.pm || '',
          ReserveAM: row.reserve_am || '',
          ReservePM: row.reserve_pm || ''
        };
        processedDates.add(date);
      }
    });

    return calendarMap;
  } catch (error) {
    console.error('Error in getRosterData:', error);
    return {};
  }
}

export async function storeRosterData(calendar: CalendarMap): Promise<void> {
  try {
    console.log('Storing data in Supabase:', calendar);
    
    // First, clear existing data
    const { error: deleteError } = await supabase
      .from('roster')
      .delete()
      .neq('id', 0); // Delete all records

    if (deleteError) {
      console.error('Error deleting existing data:', deleteError);
      throw deleteError;
    }

    // Then insert new data
    const records: RosterRecord[] = Object.entries(calendar).map(([date, entry]) => ({
      date,
      am: entry.AM,
      pm: entry.PM,
      reserve_am: entry.ReserveAM,
      reserve_pm: entry.ReservePM,
    }));

    console.log('Inserting records:', records);
    const { error: insertError } = await supabase
      .from('roster')
      .insert(records);

    if (insertError) {
      console.error('Error inserting new data:', insertError);
      throw insertError;
    }

    console.log('Data stored successfully');
  } catch (error) {
    console.error('Error in storeRosterData:', error);
    throw error;
  }
} 