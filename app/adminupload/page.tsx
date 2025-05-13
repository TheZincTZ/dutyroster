"use client";

import { useState, useEffect } from "react";
import { storeRosterData, getRosterData, CalendarMap, storeExtrasData, ExtrasPersonnel } from "../lib/supabase";
import * as XLSX from "xlsx";

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
  const [message, setMessage] = useState("");

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
    setMessage("Processing file...");

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      // Extract duty roster data (existing code)
      const calendarData: CalendarMap = {};
      for (let row = 3; row <= 27; row++) {
        const date = worksheet[`A${row}`]?.v;
        if (date) {
          calendarData[date] = {
            AM: worksheet[`B${row}`]?.v || "",
            PM: worksheet[`C${row}`]?.v || "",
            ReserveAM: worksheet[`D${row}`]?.v || "",
            ReservePM: worksheet[`E${row}`]?.v || "",
          };
        }
      }

      // Extract extras personnel data
      const extrasData: ExtrasPersonnel[] = [];
      for (let row = 28; row <= 34; row++) {
        const name = worksheet[`F${row}`]?.v;
        const numberOfExtras = worksheet[`G${row}`]?.v;
        
        if (name && numberOfExtras !== undefined) {
          extrasData.push({
            id: row - 27, // Generate sequential IDs starting from 1
            name: name.toString(),
            number_of_extras: Number(numberOfExtras)
          });
        }
      }

      // Upload both duty roster and extras data
      await Promise.all([
        storeRosterData(calendarData),
        storeExtrasData(extrasData)
      ]);

      setMessage("Data uploaded successfully!");
    } catch (error) {
      console.error("Error processing file:", error);
      setMessage("Error uploading data. Please try again.");
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
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-green-800 mb-8">Admin Upload</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-4">
            <label className="block text-green-700 mb-2">
              Upload Excel File
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              disabled={loading}
              className="w-full px-4 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          {loading && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto mb-4"></div>
              <p className="text-green-700">Uploading data...</p>
            </div>
          )}

          {message && (
            <div className={`mt-4 p-4 rounded-lg ${
              message.includes("Error") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 