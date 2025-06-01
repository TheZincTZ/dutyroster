"use client";

import { useState, useEffect } from "react";
import { storeRosterData, getRosterData, CalendarMap, storeExtrasPersonnelData, storePointSystemsData } from "../lib/db-access";

const ADMIN_PIN = "7954";
const MAX_ATTEMPTS = 5;
const PIN_LOCK_KEY = "adminUploadPinLock";

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
  
  // Map Excel columns A-H to array indices 0-7
  const COLUMN_MAP = {
    'A': 0, // Date
    'B': 1, // AM
    'C': 2, // PM
    'D': 3, // Reserve AM
    'E': 4, // Reserve PM
    'F': 5, // Extra column
    'G': 6, // Extra column
    'H': 7  // Extra column
  };

  // Process each row from 1 to 31
  for (let row = 0; row < 31; row++) {
    const dateCell = matrix[row]?.[COLUMN_MAP['A']];
    if (!dateCell) continue;
    
    const match = String(dateCell).match(/\d+/);
    if (!match) continue;
    
    const dateNum = parseInt(match[0], 10);
    if (isNaN(dateNum) || dateNum < 1 || dateNum > 31) continue;

    calendar[dateNum] = {
      AM: matrix[row]?.[COLUMN_MAP['B']] || '',
      PM: matrix[row]?.[COLUMN_MAP['C']] || '',
      ReserveAM: matrix[row]?.[COLUMN_MAP['D']] || '',
      ReservePM: matrix[row]?.[COLUMN_MAP['E']] || '',
    };
  }

  return calendar;
}

function getExtrasPersonnelData(matrix: string[][]): ExtrasPersonnel[] {
  const extras: ExtrasPersonnel[] = [];
  
  // Process rows 35-38 (indices 34-37) for extras personnel
  for (let row = 34; row <= 37; row++) {
    const name = matrix[row]?.[5]?.toString().trim(); // Column F
    const number = parseInt(matrix[row]?.[6]?.toString() || '0', 10); // Column G
    
    if (name) {
      extras.push({ name, number });
    }
  }
  
  return extras;
}

function getPointSystemData(matrix: string[][]): PointSystem[] {
  const points: PointSystem[] = [];
  
  // Map Excel columns J-M to array indices 9-12
  const COLUMN_MAP = {
    'J': 9,  // Name
    'K': 10, // Points
    'L': 11, // Months Valid
    'M': 12  // Average Points
  };

  // Brigade Morning Shift (J3-M14)
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

  // Brigade Night Shift (J17-M31)
  for (let row = 16; row <= 30; row++) {
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

  // SSP Morning Shift (J35-M35)
  const sspMorningRow = 34;
  const sspMorningName = matrix[sspMorningRow]?.[COLUMN_MAP['J']]?.toString().trim();
  if (sspMorningName) {
    points.push({
      unit: 'ssp',
      shift: 'morning',
      name: sspMorningName,
      points: Number(matrix[sspMorningRow]?.[COLUMN_MAP['K']] || 0),
      months_valid: Number(matrix[sspMorningRow]?.[COLUMN_MAP['L']] || 0),
      average_points: Number(matrix[sspMorningRow]?.[COLUMN_MAP['M']] || 0)
    });
  }

  // SSP Night Shift (J37-M44)
  for (let row = 36; row <= 43; row++) {
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

export default function AdminUploadClient() {
  const [calendar, setCalendar] = useState<CalendarMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Build current month calendar grid
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0=Sun, 1=Mon, ...
  const weeks: number[][] = [];
  let week: number[] = Array(firstDayOfWeek).fill(0);
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) {
    while (week.length < 7) week.push(0);
    weeks.push(week);
  }

  if (locked) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-red-700 mb-4">Page Locked</h2>
          <p className="text-red-600 mb-4">Too many incorrect attempts. Please contact the administrator.</p>
          <form
            onSubmit={e => {
              e.preventDefault();
              if (unlockPassword === UNLOCK_PASSWORD) {
                localStorage.removeItem("adminUploadPinLock");
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
          </div>
        )}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-8">
            {error}
          </div>
        )}
        {Object.keys(calendar).length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-green-300">
              <thead>
                <tr>
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
                    <th key={idx} className="px-2 py-2 border bg-green-100 text-xs font-semibold text-green-700">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeks.map((week, wIdx) => (
                  <tr key={wIdx}>
                    {week.map((date, dIdx) => (
                      <td key={dIdx} className="align-top px-2 py-2 border min-w-[120px]">
                        {date > 0 ? (
                          <div>
                            <div className="font-bold text-green-700 mb-1">{date}</div>
                            {calendar[date] && (
                              <div>
                                <div><span className="font-semibold text-green-700">AM:</span> <span className="text-green-800">{calendar[date].AM}</span></div>
                                <div><span className="font-semibold text-green-700">PM:</span> <span className="text-green-800">{calendar[date].PM}</span></div>
                                <div className="text-xs"><span className="font-semibold text-red-700">Res AM:</span> <span className="text-red-700">{calendar[date].ReserveAM}</span></div>
                                <div className="text-xs"><span className="font-semibold text-red-700">Res PM:</span> <span className="text-red-700">{calendar[date].ReservePM}</span></div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-green-200 text-center">—</div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
} 