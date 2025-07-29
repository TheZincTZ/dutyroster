import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Create two Supabase clients:
// 1. adminClient - has write access (used only in admin upload)
// 2. readOnlyClient - has read-only access (used in all other pages)
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    global: {
      headers: {
        'x-admin-pin': '7954'
      }
    }
  }
);

const readOnlyClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export type CalendarEntry = {
  AM: string;
  PM: string;
  ReserveAM: string;
  ReservePM: string;
}

export type CalendarMap = { [date: string]: CalendarEntry };

// Write operations - only accessible from admin upload page
export async function storeRosterData(calendarData: CalendarMap, month: number, year: number) {
  const { error } = await adminClient
    .from('roster_data')
    .upsert(
      Object.entries(calendarData).map(([date, entry]) => ({
        date: date,
        month: month,
        year: year,
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

export async function storeExtrasPersonnelData(extras: { name: string, number: number }[]) {
  const { error } = await adminClient
    .from('extras_personnel')
    .upsert(extras);

  if (error) {
    console.error('Error storing extras personnel data:', error);
    throw error;
  }
}

export async function storePointSystemsData(points: { unit: string, shift: string, name: string, points: number, months_valid: number, average_points: number }[], month: number, year: number) {
  const { error } = await adminClient
    .from('point_systems')
    .upsert(
      points.map(point => ({
        ...point,
        month: month,
        year: year
      }))
    );

  if (error) {
    console.error('Error storing point systems data:', error);
    throw error;
  }
}

// Read operations - accessible from all pages
export async function getRosterData(month?: number, year?: number): Promise<CalendarMap> {
  let query = readOnlyClient
    .from('roster_data')
    .select('*')
    .order('date');

  // If month and year are provided, filter by them
  if (month !== undefined && year !== undefined) {
    query = query.eq('month', month).eq('year', year);
  }

  const { data, error } = await query;

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

// New function to get available months from the database
export async function getAvailableMonths(): Promise<{ month: number; year: number; monthName: string }[]> {
  const { data, error } = await readOnlyClient
    .from('roster_data')
    .select('month, year')
    .order('year', { ascending: false })
    .order('month', { ascending: false });

  if (error) {
    console.error('Error fetching available months:', error);
    throw error;
  }

  // Get unique month/year combinations
  const uniqueMonths = new Map<string, { month: number; year: number }>();
  data.forEach((row) => {
    const key = `${row.year}-${row.month}`;
    if (!uniqueMonths.has(key)) {
      uniqueMonths.set(key, { month: row.month, year: row.year });
    }
  });

  // Convert to array and add month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return Array.from(uniqueMonths.values()).map(({ month, year }) => ({
    month,
    year,
    monthName: `${monthNames[month - 1]} ${year}`
  }));
}

export async function getExtrasPersonnel() {
  const { data, error } = await readOnlyClient
    .from('extras_personnel')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching extras personnel:', error);
    throw error;
  }

  return data;
}

export async function getPointSystems() {
  const { data, error } = await readOnlyClient
    .from('point_systems')
    .select('*')
    .order('unit')
    .order('shift')
    .order('name');

  if (error) {
    console.error('Error fetching point systems:', error);
    throw error;
  }

  return data;
}

// Export the read-only client for direct queries in other components
export const supabase = readOnlyClient; 