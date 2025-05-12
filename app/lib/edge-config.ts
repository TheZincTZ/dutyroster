import { createClient } from '@vercel/edge-config';

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

const EDGE_CONFIG_KEY = 'duty_roster_data';

export async function storeRosterData(calendarData: CalendarMap) {
  const config = createClient(process.env.EDGE_CONFIG);
  await config.set({
    [EDGE_CONFIG_KEY]: JSON.stringify(calendarData)
  });
}

export async function getRosterData(): Promise<CalendarMap> {
  const config = createClient(process.env.EDGE_CONFIG);
  const data = await config.get(EDGE_CONFIG_KEY);
  if (!data) return {};
  return JSON.parse(data as string);
} 