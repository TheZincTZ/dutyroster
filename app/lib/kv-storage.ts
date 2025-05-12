import { kv } from '@vercel/kv';

export interface RosterData {
  date: string;
  personnel: string;
  scoreboard: string;
}

export interface CalendarEntry {
  AM: string;
  PM: string;
  ReserveAM: string;
  ReservePM: string;
}

export type CalendarMap = { [date: number]: CalendarEntry };

const KV_KEY = 'duty_roster_data';

export async function storeRosterData(calendarData: CalendarMap) {
  await kv.set(KV_KEY, JSON.stringify(calendarData));
}

export async function getRosterData(): Promise<CalendarMap> {
  const data = await kv.get(KV_KEY);
  if (!data) return {};
  return JSON.parse(data as string);
} 