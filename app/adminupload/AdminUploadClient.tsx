"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { storeRosterData, CalendarMap, storePointSystemsData, getAvailableMonths } from "../lib/db-access";
import Link from "next/link";

const MAX_ATTEMPTS = 5;

// Remove hardcoded PIN_LOCK_KEY and use environment variable
const PIN_LOCK_KEY = process.env.NEXT_PUBLIC_PIN_LOCK_KEY || "";

// Remove hardcoded ADMIN_PIN and use environment variable
const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN || "";

type PointSystem = {
  unit: 'brigade' | 'ssp';
  shift: 'morning' | 'night';
  name: string;
  points: number;
  months_valid: number;
  average_points: number;
};

// Function to extract month and year from A1-2
function extractMonthYear(matrix: string[][]): { month: number; year: number; monthName: string } | null {
  try {
    const a1 = matrix[0]?.[0]?.toString().trim() || '';
    const a2 = matrix[1]?.[0]?.toString().trim() || '';
    const monthNames = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    for (const text of [a1, a2]) {
      if (!text) continue;
      const lowerText = text.toLowerCase();
      for (let i = 0; i < monthNames.length; i++) {
        const monthName = monthNames[i];
        if (lowerText.includes(monthName)) {
          const yearMatch = text.match(/\b(20\d{2})\b/);
          if (yearMatch) {
            return { 
              month: i + 1, 
              year: parseInt(yearMatch[1], 10),
              monthName: monthNames[i]
            };
          }
        }
      }
      const monthYearMatch = lowerText.match(/(january|february|march|april|may|june|july|august|september|october|november|december)\s+(20\d{2})/);
      if (monthYearMatch) {
        const monthIndex = monthNames.indexOf(monthYearMatch[1]);
        if (monthIndex !== -1) {
          return { 
            month: monthIndex + 1, 
            year: parseInt(monthYearMatch[2], 10),
            monthName: monthNames[monthIndex]
          };
        }
      }
    }
    const now = new Date();
    const currentMonthName = monthNames[now.getMonth()];
    return { 
      month: now.getMonth() + 1, 
      year: now.getFullYear(),
      monthName: currentMonthName
    };
  } catch (error) {
    console.error('Error extracting month/year:', error);
    const now = new Date();
    const monthNames = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    const currentMonthName = monthNames[now.getMonth()];
    return { 
      month: now.getMonth() + 1, 
      year: now.getFullYear(),
      monthName: currentMonthName
    };
  }
}

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

  // Brigade Night Shift (J17-M35, rows 16–34)
  for (let row = 16; row <= 34; row++) {
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

  // SSP Morning Shift (J39-M39, row 38)
  {
    const row = 38;
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

  // SSP Night Shift (J41-M48, rows 40–47)
  for (let row = 40; row <= 47; row++) {
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(true);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinAttempts, setPinAttempts] = useState(0);
  const [authenticated, setAuthenticated] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [availableMonths, setAvailableMonths] = useState<{ month: number; year: number; monthName: string }[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<{ month: number; year: number } | null>(null);
  
  // Use ref to track upload state more reliably
  const isUploadingRef = useRef(false);

  const UNLOCK_PASSWORD = "3sibdutyTemasekSIB#?";

  // Get current month and year for display
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Load available months
      const months = await getAvailableMonths();
      setAvailableMonths(months);
      
      // Set selected month to current month if available, otherwise to the most recent month
      if (months.length > 0) {
        const currentMonthData = months.find(m => m.month === currentMonth + 1 && m.year === currentYear);
        setSelectedMonth(currentMonthData ? { month: currentMonthData.month, year: currentMonthData.year } : { month: months[0].month, year: months[0].year });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear]);

  // Check if admin is locked
  useEffect(() => {
    const lockState = localStorage.getItem(PIN_LOCK_KEY);
    if (lockState === "true") {
      setIsLocked(true);
    } else {
      setIsLocked(false);
      loadData();
    }
  }, [loadData]);

  // Lock if attempts exceeded
  useEffect(() => {
    if (pinAttempts >= MAX_ATTEMPTS) {
      setIsLocked(true);
      localStorage.setItem(PIN_LOCK_KEY, "true");
    }
  }, [pinAttempts]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    if (pin === ADMIN_PIN) {
      setAuthenticated(true);
      setPinError("");
      setIsLocked(false);
      localStorage.removeItem(PIN_LOCK_KEY);
      loadData();
    } else {
      setPinError("Incorrect PIN");
      setPinAttempts((a: number) => a + 1);
      setPin("");
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    isUploadingRef.current = true; // Set ref immediately
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to upload file");
      const result = await response.json();
      
      // Extract month and year from A1-2
      const monthYear = extractMonthYear(result.data);
      if (!monthYear) {
        throw new Error("Could not extract month and year from Excel file");
      }
      
      // Process and store duty roster data
      const newCalendar = getCurrentMonthCalendarData(result.data);
      await storeRosterData(newCalendar, monthYear.month, monthYear.year);

      // Process and store point system data
      const pointSystems = getPointSystemData(result.data);
      if (pointSystems.length > 0) {
        await storePointSystemsData(pointSystems, monthYear.month, monthYear.year);
      }

      // Refresh available months and set selected month to the uploaded month
      const months = await getAvailableMonths();
      setAvailableMonths(months);
      
      // Update selected month - this won't trigger useEffect due to uploadedCalendarData
      setSelectedMonth({ month: monthYear.month, year: monthYear.year });

      setSuccess(`File uploaded successfully! Schedule for ${monthYear.monthName} ${monthYear.year} has been updated.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
      isUploadingRef.current = false; // Reset ref
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

  if (isLocked) {
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
            disabled={isLocked}
            autoFocus
          />
          {pinError && <div className="text-red-600 mb-2 text-center">{pinError}</div>}
          <button
            type="submit"
            className="w-full bg-green-700 text-white py-2 rounded font-semibold hover:bg-green-800 transition"
            disabled={isLocked || pin.length !== 4}
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
    <main className="min-h-screen p-4 sm:p-6 md:p-8 bg-green-50">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-2xl p-4 sm:p-6 md:p-10 border border-green-100">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-green-900 tracking-tight flex items-center gap-2">
              <span className="inline-block w-2 h-6 sm:h-8 bg-green-600 rounded-full mr-2"></span>
              Admin Upload
            </h1>
            <button
              onClick={() => {
                localStorage.setItem(PIN_LOCK_KEY, "true");
                window.location.reload();
              }}
              className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
              title="Lock Admin"
            >
              🔒 Lock
            </button>
          </div>
          <Link 
            href="/" 
            className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors font-semibold text-center"
          >
            Back to Roster
          </Link>
        </div>

        {/* Data Last Updated */}
        <div className="mb-4 text-center">
          <div className="text-green-600 text-sm">
            Data last updated: {new Date().toLocaleDateString("en-US", { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>

        {/* Month Selector */}
        {availableMonths.length > 0 && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-3">Select Month to View:</h3>
            <div className="flex flex-wrap gap-2">
              {availableMonths.map((monthData) => (
                <button
                  key={`${monthData.year}-${monthData.month}`}
                  onClick={() => setSelectedMonth({ month: monthData.month, year: monthData.year })}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedMonth?.month === monthData.month && selectedMonth?.year === monthData.year
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-green-700 border border-green-300 hover:bg-green-100'
                  }`}
                >
                  {monthData.monthName}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* File Upload Section */}
        <div className="mb-6 p-6 bg-green-50 rounded-xl border-2 border-dashed border-green-300">
          <h3 className="text-xl font-bold text-green-800 mb-4">Upload Excel File</h3>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="w-full p-3 border border-green-300 rounded-lg bg-white"
            disabled={loading}
          />
        {loading && (
            <div className="mt-4 text-center text-green-700">
              <span className="text-2xl animate-spin">🌀</span> Processing...
          </div>
        )}
        {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700">
            {error}
          </div>
        )}
          {success && (
            <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg text-green-700">
              {success}
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 