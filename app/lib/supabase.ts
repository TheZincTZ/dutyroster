import { createClient } from '@supabase/supabase-js';
import { CalendarMap, ExtrasPersonnel, PointSystem } from "./types";

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { data: any; timestamp: number }>();

// Initialize Supabase client with security options
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase configuration");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'dutyroster'
    }
  }
});

// Helper function to validate data
function validateData<T>(data: any, schema: (item: any) => boolean): T[] {
  if (!Array.isArray(data)) return [];
  return data.filter(schema) as T[];
}

// Helper function to handle cache
function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }
  return null;
}

function setCachedData<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export async function getRosterData(): Promise<CalendarMap> {
  try {
    const cacheKey = 'roster_data';
    const cached = getCachedData<CalendarMap>(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from("duty_roster")
      .select("*")
      .order("date", { ascending: true });

    if (error) throw error;

    // Validate data structure
    const validData = validateData(data, (item) => 
      typeof item === 'object' &&
      item !== null &&
      'date' in item &&
      'am' in item &&
      'pm' in item &&
      'reserveam' in item &&
      'reservepm' in item
    );

    const calendarMap: CalendarMap = {};
    validData.forEach((item) => {
      calendarMap[item.date] = {
        AM: item.am,
        PM: item.pm,
        ReserveAM: item.reserveam,
        ReservePM: item.reservepm
      };
    });

    setCachedData(cacheKey, calendarMap);
    return calendarMap;
  } catch (error) {
    console.error("Error fetching roster data:", error);
    return {};
  }
}

export async function getExtrasPersonnel(): Promise<ExtrasPersonnel[]> {
  try {
    const cacheKey = 'extras_personnel';
    const cached = getCachedData<ExtrasPersonnel[]>(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from("extras_personnel")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;

    // Validate data structure
    const validData = validateData<ExtrasPersonnel>(data, (item) =>
      typeof item === 'object' &&
      item !== null &&
      typeof item.name === 'string' &&
      typeof item.number === 'number' &&
      item.name.length > 0
    );

    setCachedData(cacheKey, validData);
    return validData;
  } catch (error) {
    console.error("Error fetching extras personnel:", error);
    return [];
  }
}

export async function getPointSystems(): Promise<PointSystem[]> {
  try {
    const cacheKey = 'point_systems';
    const cached = getCachedData<PointSystem[]>(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from("point_systems")
      .select("*")
      .order("id", { ascending: true });

    if (error) throw error;

    // Validate data structure
    const validData = validateData<PointSystem>(data, (item) =>
      typeof item === 'object' &&
      item !== null &&
      'id' in item &&
      'name' in item &&
      'points' in item
    );

    setCachedData(cacheKey, validData);
    return validData;
  } catch (error) {
    console.error("Error fetching point systems:", error);
    return [];
  }
}

// Clear cache when data is updated
export function clearCache(): void {
  cache.clear();
}

// Add cache clearing to data update functions
export async function storeRosterData(data: CalendarMap): Promise<void> {
  try {
    const { error } = await supabase.from("duty_roster").upsert(
      Object.entries(data).map(([date, values]) => ({
        date,
        am: values.AM,
        pm: values.PM,
        reserveam: values.ReserveAM,
        reservepm: values.ReservePM
      }))
    );
    if (error) throw error;
    clearCache();
  } catch (error) {
    console.error("Error storing roster data:", error);
    throw error;
  }
}

export async function storeExtrasPersonnelData(data: ExtrasPersonnel[]): Promise<void> {
  try {
    const { error } = await supabase.from("extras_personnel").upsert(data);
    if (error) throw error;
    clearCache();
  } catch (error) {
    console.error("Error storing extras personnel data:", error);
    throw error;
  }
}

export async function storePointSystemsData(data: PointSystem[]): Promise<void> {
  try {
    const { error } = await supabase.from("point_systems").upsert(data);
    if (error) throw error;
    clearCache();
  } catch (error) {
    console.error("Error storing point systems data:", error);
    throw error;
  }
} 