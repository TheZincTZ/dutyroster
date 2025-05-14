"use client";

import { useState, useEffect } from "react";
import { storeRosterData, getRosterData, storeExtrasPersonnelData, storePointSystemsData } from "../lib/supabase";
import { CalendarMap, ExtrasPersonnel, PointSystem } from "../lib/types";
import { validateFile } from "../lib/security";

const DATE_ROW_INDEXES = [1, 6, 11, 16, 21]; // 0-based: rows 2,7,12,17,22
const ADMIN_PIN = "7954";
const MAX_ATTEMPTS = 5;
const PIN_LOCK_KEY = "adminUploadPinLock";

function getMay2025CalendarData(matrix: string[][]): CalendarMap {
  const calendar: CalendarMap = {};
  for (let w = 0; w < DATE_ROW_INDEXES.length; w++) {
    const weekStart = DATE_ROW_INDEXES[w];
    const dateRow = matrix[weekStart];
    const amRow = matrix[weekStart + 1];
    const pmRow = matrix[weekStart + 2];
    const reserveAmRow = matrix[weekStart + 3];
    const reservePmRow = matrix[weekStart + 4];

    // For the first week, use columns 3-8 (D-I); for others, use 1-8 (B-I)
    const colStart = w === 0 ? 3 : 1;
    const colEnd = 8; // inclusive, column I

    for (let col = colStart; col <= colEnd; col++) {
      const dateCell = dateRow[col];
      if (!dateCell) continue;
      const match = String(dateCell).match(/\d+/);
      if (!match) continue;
      const dateNum = parseInt(match[0], 10);
      if (isNaN(dateNum)) continue;
      calendar[dateNum] = {
        AM: amRow[col] || '',
        PM: pmRow[col] || '',
        ReserveAM: reserveAmRow[col] || '',
        ReservePM: reservePmRow[col] || '',
      };
    }
  }
  return calendar;
}

export default function AdminUpload() {
  const [calendar, setCalendar] = useState<CalendarMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinAttempts, setPinAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

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
      const newCalendar = getMay2025CalendarData(result.data);
      setCalendar(newCalendar);
      
      // Store the calendar data in Edge Config
      await storeRosterData(newCalendar);

      // Store extras personnel data (no batch)
      if (result.extrasPersonnel && result.extrasPersonnel.length > 0) {
        await storeExtrasPersonnelData((result.extrasPersonnel as ExtrasPersonnel[]).map((p) => ({
          name: p.name,
          number: p.number
        })));
      }

      // Store point system data
      if (result.pointSystems && result.pointSystems.length > 0) {
        await storePointSystemsData(result.pointSystems);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Build May 2025 calendar grid
  const daysInMonth = 31;
  const firstDayOfWeek = new Date(2025, 4, 1).getDay(); // 0=Sun, 1=Mon, ...
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
          <p className="text-red-600">Too many incorrect attempts. Please contact the administrator.</p>
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
        <h1 className="text-3xl font-bold mb-8 text-green-800">Admin: Upload May 2025 Duty Roster</h1>
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