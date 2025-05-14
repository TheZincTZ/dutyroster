"use client";

import { useState, useEffect } from "react";
import { storeRosterData, getRosterData, storeExtrasPersonnelData, storePointSystemsData } from "../lib/supabase";
import { CalendarMap, ExtrasPersonnel, PointSystem } from "../lib/types";
import { validateFile } from "../lib/security";

const DATE_ROW_INDEXES = [1, 6, 11, 16, 21]; // 0-based: rows 2,7,12,17,22

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

export default function AdminUploadClient() {
  const [calendar, setCalendar] = useState<CalendarMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const calendarData = await getRosterData();
        if (Object.keys(calendarData).length > 0) {
          setCalendar(calendarData);
        }
      } catch {
        setError("Failed to load data");
      }
    };
    loadData();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file
    const { valid, error: fileError } = validateFile(file);
    if (!valid) {
      setError(fileError || "Invalid file");
      return;
    }

    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      if (!response.ok) throw new Error("Failed to upload file");
      const result = await response.json();
      
      // Validate the response data structure
      if (!result.data || !Array.isArray(result.data)) {
        throw new Error("Invalid data format received");
      }

      const newCalendar = getMay2025CalendarData(result.data);
      
      // Validate calendar data before storing
      if (Object.keys(newCalendar).length === 0) {
        throw new Error("No valid calendar data found in file");
      }

      setCalendar(newCalendar);
      
      // Store the calendar data
      await storeRosterData(newCalendar);

      // Store extras personnel data with validation
      if (result.extrasPersonnel && Array.isArray(result.extrasPersonnel)) {
        const validExtras = result.extrasPersonnel.filter((p: ExtrasPersonnel) => 
          typeof p.name === 'string' && 
          typeof p.number === 'number' &&
          p.name.length > 0
        );
        if (validExtras.length > 0) {
          await storeExtrasPersonnelData(validExtras);
        }
      }

      // Store point system data with validation
      if (result.pointSystems && Array.isArray(result.pointSystems)) {
        const validPoints = result.pointSystems.filter((p: PointSystem) => 
          typeof p === 'object' && 
          p !== null &&
          'unit' in p &&
          'shift' in p &&
          'name' in p &&
          'points' in p
        );
        if (validPoints.length > 0) {
          await storePointSystemsData(validPoints);
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
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

  return (
    <main className="min-h-screen p-8 bg-green-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-green-800">Admin: Upload May 2025 Duty Roster</h1>
        </div>
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