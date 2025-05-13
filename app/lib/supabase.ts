import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export interface CalendarEntry {
  AM: string;
  PM: string;
  ReserveAM: string;
  ReservePM: string;
}

export type CalendarMap = {
  [date: string]: CalendarEntry;
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
    console.log('Fetching data from Supabase...');
    const { data, error } = await supabase
      .from('roster')
      .select('*');

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('Raw data from Supabase:', data);

    if (!data || data.length === 0) {
      console.log('No data found in Supabase');
      return {};
    }

    // Convert the array of records to a map
    const calendarMap: CalendarMap = {};
    data.forEach((record: RosterRecord) => {
      console.log('Processing record:', record);
      calendarMap[record.date] = {
        AM: record.am || '',
        PM: record.pm || '',
        ReserveAM: record.reserve_am || '',
        ReservePM: record.reserve_pm || '',
      };
    });

    console.log('Processed calendar map:', calendarMap);
    return calendarMap;
  } catch (error) {
    console.error('Error in getRosterData:', error);
    throw error;
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