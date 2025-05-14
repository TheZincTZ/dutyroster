export interface CalendarEntry {
  AM: string;
  PM: string;
  ReserveAM: string;
  ReservePM: string;
}

export type CalendarMap = { [date: string]: CalendarEntry };

export interface ExtrasPersonnel {
  name: string;
  number: number;
}

export interface PointSystem {
  unit: string;
  shift: string;
  name: string;
  points: number;
  months_valid: number;
  average_points: number;
}

export interface RosterData {
  date: string;
  am: string;
  pm: string;
  reserve_am: string;
  reserve_pm: string;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
} 