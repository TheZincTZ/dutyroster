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

export interface CalendarEntry {
  AM: string;
  PM: string;
  ReserveAM: string;
  ReservePM: string;
}

export type CalendarMap = { [date: string]: CalendarEntry };

export async function storeRosterData(calendarData: CalendarMap) {
  console.log('Storing roster data:', calendarData);
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
  console.log('Fetching roster data from Supabase...');
  const { data, error } = await supabase
    .from('roster_data')
    .select('*')
    .order('date');

  if (error) {
    console.error('Error fetching roster data:', error);
    throw error;
  }

  console.log('Raw data from Supabase:', data);

  const calendarMap: CalendarMap = {};
  data.forEach((row) => {
    calendarMap[row.date] = {
      AM: row.am,
      PM: row.pm,
      ReserveAM: row.reserve_am,
      ReservePM: row.reserve_pm,
    };
  });

  console.log('Processed calendar map:', calendarMap);
  return calendarMap;
} 