"use client";

import { useState, useEffect } from "react";
import { storeRosterData, getRosterData, CalendarMap, storeExtrasPersonnelData, storePointSystemsData } from "../lib/db-access";

const MAX_ATTEMPTS = 5;

// Remove hardcoded PIN_LOCK_KEY and use environment variable
const PIN_LOCK_KEY = process.env.NEXT_PUBLIC_PIN_LOCK_KEY || "";

// Remove hardcoded ADMIN_PIN and use environment variable
const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN || "";

type ExtrasPersonnel = { name: string; number: number };

type PointSystem = {
  unit: 'brigade' | 'ssp';
  shift: 'morning' | 'night';
  name: string;
  points: number;
  months_valid: number;
  average_points: number;
};

function getCurrentMonthCalendarData(matrix: string[][]): CalendarMap {
  const calendar: CalendarMap = {};
  // Week blocks start at rows 1, 6, 11, 16, 21 (0-based)
  const weekStarts = [1, 6, 11, 16, 21];
  for (const start of weekStarts) {
    const dateRow = matrix[start];
    const amRow = matrix[start + 1];
    const pmRow = matrix[start + 2];
    const reserveAmRow = matrix[start + 3];
    const reservePmRow = matrix[start + 4];
    if (!dateRow || !amRow || !pmRow || !reserveAmRow || !reservePmRow) continue;
    for (let col = 1; col <= 7; col++) { // B-H, 1-7
      const dateCell = dateRow[col];
      const dateNum = parseInt(dateCell, 10);
      if (!dateCell || isNaN(dateNum) || dateNum < 1 || dateNum > 31) continue;
      calendar[dateNum] = {
        AM: amRow[col]?.toString().trim() || '',
        PM: pmRow[col]?.toString().trim() || '',
        ReserveAM: reserveAmRow[col]?.toString().trim() || '',
        ReservePM: reservePmRow[col]?.toString().trim() || '',
      };
    }
  }
  return calendar;
}

function getExtrasPersonnelData(matrix: string[][]): ExtrasPersonnel[] {
  const extras: ExtrasPersonnel[] = [];
  // Start at row 36 (index 35), go down until name is empty
  for (let row = 35; row < matrix.length; row++) {
    const name = matrix[row]?.[5]?.toString().trim(); // Column F
    const number = parseInt(matrix[row]?.[6]?.toString() || '0', 10); // Column G
    if (!name) break; // Stop at first empty row
    extras.push({ name, number });
  }
  return extras;
}

function getPointSystemData(matrix: string[][]): PointSystem[] {
  const points: PointSystem[] = [];
  const COLUMN_MAP = { 'J': 9, 'K': 10, 'L': 11, 'M': 12 };

  // Brigade Morning Shift (J3-M14, rows 2–13)
  for (let row = 2; row <= 13; row++) {
    const name = matrix[row]?.[COLUMN_MAP['J']]?.toString().trim();
    if (name) {
      points.push({
        unit: 'brigade',
        shift: 'morning',
        name,
        points: Number(matrix[row]?.[COLUMN_MAP['K']] || 0),
        months_valid: Number(matrix[row]?.[COLUMN_MAP['L']] || 0),
        average_points: Number(matrix[row]?.[COLUMN_MAP['M']] || 0)
      });
    }
  }

  // Brigade Night Shift (J17-M32, rows 16–31)
  for (let row = 16; row <= 31; row++) {
    const name = matrix[row]?.[COLUMN_MAP['J']]?.toString().trim();
    if (name) {
      points.push({
        unit: 'brigade',
        shift: 'night',
        name,
        points: Number(matrix[row]?.[COLUMN_MAP['K']] || 0),
        months_valid: Number(matrix[row]?.[COLUMN_MAP['L']] || 0),
        average_points: Number(matrix[row]?.[COLUMN_MAP['M']] || 0)
      });
    }
  }

  // SSP Morning Shift (J36-M36, row 35)
  {
    const row = 35;
    const name = matrix[row]?.[COLUMN_MAP['J']]?.toString().trim();
    if (name) {
      points.push({
        unit: 'ssp',
        shift: 'morning',
        name,
        points: Number(matrix[row]?.[COLUMN_MAP['K']] || 0),
        months_valid: Number(matrix[row]?.[COLUMN_MAP['L']] || 0),
        average_points: Number(matrix[row]?.[COLUMN_MAP['M']] || 0)
      });
    }
  }

  // SSP Night Shift (J38-M45, rows 37–44)
  for (let row = 37; row <= 44; row++) {
    const name = matrix[row]?.[COLUMN_MAP['J']]?.toString().trim();
    if (name) {
      points.push({
        unit: 'ssp',
        shift: 'night',
        name,
        points: Number(matrix[row]?.[COLUMN_MAP['K']] || 0),
        months_valid: Number(matrix[row]?.[COLUMN_MAP['L']] || 0),
        average_points: Number(matrix[row]?.[COLUMN_MAP['M']] || 0)
      });
    }
  }

  return points;
}

// Helper function to render a name with (EXTRA) in bold red
function renderName(name: string) {
  if (name && name.includes('(EXTRA)')) {
    return <span style={{ color: 'red', fontWeight: 'bold' }}>{name}</span>;
  }
  return name;
}

export default function AdminUploadClient() {
  const [calendar, setCalendar] = useState<CalendarMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinAttempts, setPinAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const UNLOCK_PASSWORD = "3sibdutyTemasekSIB#?";

  // Get current month and year
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Load from Edge Config on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const calendarData = await getRosterData();
        if (Object.keys(calendarData).length > 0) {
          setCalendar(calendarData);
        }
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };
    
    loadData();
    
    // Check lock state
    const lockState = localStorage.getItem(PIN_LOCK_KEY);
    if (lockState === "locked") {
      setLocked(true);
    }
  }, []);

  // Lock if attempts exceeded
  useEffect(() => {
    if (pinAttempts >= MAX_ATTEMPTS) {
      setLocked(true);
      localStorage.setItem(PIN_LOCK_KEY, "locked");
    }
  }, [pinAttempts]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;
    if (pin === ADMIN_PIN) {
      setAuthenticated(true);
      setPinError(null);
    } else {
      setPinError("Incorrect PIN");
      setPinAttempts((a) => a + 1);
      setPin("");
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to upload file");
      const result = await response.json();
      
      // Process and store duty roster data
      const newCalendar = getCurrentMonthCalendarData(result.data);
      setCalendar(newCalendar);
      await storeRosterData(newCalendar);

      // Process and store extras personnel data
      const extrasPersonnel = getExtrasPersonnelData(result.data);
      if (extrasPersonnel.length > 0) {
        await storeExtrasPersonnelData(extrasPersonnel);
      }

      // Process and store point system data
      const pointSystems = getPointSystemData(result.data);
      if (pointSystems.length > 0) {
        await storePointSystemsData(pointSystems);
      }

      setSuccess("File uploaded successfully! Schedule has been updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Build 5-week calendar grid always starting from Monday
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const firstDayOfWeek = firstDayOfMonth.getDay(); // 0=Sun, 1=Mon, ...
  
  // Calculate the Monday that starts the first week of the month
  const startDate = new Date(firstDayOfMonth);
  const daysToSubtract = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Convert Sunday=0 to Monday=0
  startDate.setDate(startDate.getDate() - daysToSubtract);
  
  type DayInfo = { date: number; isCurrentMonth: boolean; month: number; year: number };
  const weeks: DayInfo[][] = [];
  
  // Generate 5 weeks
  for (let week = 0; week < 5; week++) {
    const weekData: DayInfo[] = [];
    
    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + (week * 7) + day);
      
      weekData.push({
        date: currentDate.getDate(),
        isCurrentMonth: currentDate.getMonth() === currentMonth,
        month: currentDate.getMonth(),
        year: currentDate.getFullYear()
      });
    }
    
    weeks.push(weekData);
  }

  if (locked) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-red-700 mb-4">Page Locked</h2>
          <p className="text-red-600 mb-4">Max attempts exceeded. Please contact the administrator.</p>
          <form
            onSubmit={e => {
              e.preventDefault();
              if (unlockPassword === UNLOCK_PASSWORD) {
                localStorage.removeItem(PIN_LOCK_KEY);
                window.location.reload();
              } else {
                setUnlockError("Incorrect unlock password.");
              }
            }}
            className="space-y-2"
          >
            <input
              type="password"
              value={unlockPassword}
              onChange={e => setUnlockPassword(e.target.value)}
              className="w-full px-4 py-2 border border-green-300 rounded text-lg text-center focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="Enter unlock password"
            />
            {unlockError && <div className="text-red-600 text-sm">{unlockError}</div>}
            <button
              type="submit"
              className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors font-semibold w-full"
            >
              Unlock
            </button>
          </form>
        </div>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-green-50">
        <form onSubmit={handlePinSubmit} className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold text-green-800 mb-6 text-center">Admin PIN Required</h2>
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            value={pin}
            onChange={e => setPin(e.target.value.replace(/[^0-9]/g, ""))}
            className="w-full mb-4 px-4 py-2 border border-green-300 rounded text-lg text-center focus:outline-none focus:ring-2 focus:ring-green-400"
            placeholder="Enter 4-digit PIN"
            disabled={locked}
            autoFocus
          />
          {pinError && <div className="text-red-600 mb-2 text-center">{pinError}</div>}
          <button
            type="submit"
            className="w-full bg-green-700 text-white py-2 rounded font-semibold hover:bg-green-800 transition"
            disabled={locked || pin.length !== 4}
          >
            Unlock
          </button>
          <div className="mt-4 text-sm text-green-700 text-center">
            Attempts left: {MAX_ATTEMPTS - pinAttempts}
          </div>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 bg-green-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-green-800">Admin: Upload {monthName} {currentYear} Duty Roster</h1>
        <div className="mb-8 bg-white p-6 rounded-lg shadow-sm">
          <label className="block text-sm font-medium text-green-700 mb-2">
            Upload Duty Roster File
          </label>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="block w-full text-sm text-green-700
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-green-50 file:text-green-700
              hover:file:bg-green-100"
          />
        </div>
        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700 mx-auto"></div>
            <p className="mt-2 text-green-700">Processing file and updating database...</p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-8">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-8">
            {success}
          </div>
        )}
        {Object.keys(calendar).length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-green-800 mb-6">Current Schedule</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-green-300 rounded-xl">
                <thead>
                  <tr>
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, idx) => (
                      <th key={idx} className="px-4 py-3 border bg-green-100 text-green-700 font-semibold">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                                  {weeks.map((week, wIdx) => (
                  <tr key={wIdx}>
                    {week.map((dayInfo, dIdx) => (
                      <td key={dIdx} className={`align-top px-4 py-3 border min-w-[180px] transition ${
                        dayInfo.isCurrentMonth ? 'bg-green-50 hover:bg-green-100' : 'bg-gray-50'
                      }`}>
                        <div>
                          <div className={`font-bold mb-2 text-lg ${
                            dayInfo.isCurrentMonth ? 'text-green-700' : 'text-gray-400'
                          }`}>
                            {dayInfo.date}
                          </div>
                          {dayInfo.isCurrentMonth && calendar[dayInfo.date] && (
                            <div className="space-y-2">
                              <div className="bg-white p-2 rounded shadow-sm">
                                <div className="font-semibold text-green-700">AM:</div>
                                <div className="text-green-800 text-sm">{renderName(calendar[dayInfo.date].AM)}</div>
                              </div>
                              <div className="bg-white p-2 rounded shadow-sm">
                                <div className="font-semibold text-black">Reserve AM:</div>
                                <div className="text-black text-sm">{renderName(calendar[dayInfo.date].ReserveAM)}</div>
                              </div>
                              <div className="bg-white p-2 rounded shadow-sm">
                                <div className="font-semibold text-green-700">PM:</div>
                                <div className="text-green-800 text-sm">{renderName(calendar[dayInfo.date].PM)}</div>
                              </div>
                              <div className="bg-white p-2 rounded shadow-sm">
                                <div className="font-semibold text-black">Reserve PM:</div>
                                <div className="text-black text-sm">{renderName(calendar[dayInfo.date].ReservePM)}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 