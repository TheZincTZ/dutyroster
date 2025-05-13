import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export type CalendarEntry = {
  AM: string;
  PM: string;
  ReserveAM: string;
  ReservePM: string;
}

export type CalendarMap = {
  [key: string]: {
    AM: string;
    PM: string;
    ReserveAM: string;
    ReservePM: string;
  };
};

export type ExtrasPersonnel = {
  id: number;
  name: string;
  contact: string;
};

export async function storeRosterData(calendarData: CalendarMap) {
  const { error } = await supabase
    .from('roster_data')
    .upsert(
      Object.entries(calendarData).map(([date, entry]) => ({
        date: date,
        am: entry.AM,
        pm: entry.PM,
        reserve_am: entry.ReserveAM,
        reserve_pm: entry.ReservePM,
      }))
    );

  if (error) {
    console.error('Error storing roster data:', error);
    throw error;
  }
}

export async function getRosterData(): Promise<CalendarMap> {
  const { data, error } = await supabase
    .from('roster_data')
    .select('*')
    .order('date');

  if (error) {
    console.error('Error fetching roster data:', error);
    throw error;
  }

  const calendarMap: CalendarMap = {};
  data.forEach((row) => {
    calendarMap[row.date] = {
      AM: row.am,
      PM: row.pm,
      ReserveAM: row.reserve_am,
      ReservePM: row.reserve_pm,
    };
  });

  return calendarMap;
}

// Function to get extras personnel data
export async function getExtrasData(): Promise<ExtrasPersonnel[]> {
  const { data, error } = await supabase
    .from('extras_personnel')
    .select('*')
    .order('id');

  if (error) {
    console.error('Error fetching extras data:', error);
    throw error;
  }

  return data || [];
}

// Function to store extras personnel data
export async function storeExtrasData(extras: ExtrasPersonnel[]): Promise<void> {
  // First, clear existing data
  const { error: deleteError } = await supabase
    .from('extras_personnel')
    .delete()
    .neq('id', 0); // Delete all records

  if (deleteError) {
    console.error('Error clearing extras data:', deleteError);
    throw deleteError;
  }

  // Then insert new data
  const { error: insertError } = await supabase
    .from('extras_personnel')
    .insert(extras);

  if (insertError) {
    console.error('Error storing extras data:', insertError);
    throw insertError;
  }
} 