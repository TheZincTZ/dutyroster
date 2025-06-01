"use client";

import { useEffect, useState } from "react";
import { getRosterData, CalendarMap } from "../lib/db-access";
import Link from "next/link";

export default function MonthlyscheduleClient() {
  const [calendar, setCalendar] = useState<CalendarMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const calendarData = await getRosterData();
        setCalendar(calendarData);
      } catch {
        setError("Failed to load duty roster");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Get current month and year
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Get days in current month
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

  // Format month name
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  return (
    <main className="min-h-screen p-4 sm:p-6 md:p-8 bg-green-50">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl p-4 sm:p-6 md:p-10 border border-green-100">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-green-900 tracking-tight flex items-center gap-2">
            <span className="inline-block w-2 h-6 sm:h-8 bg-green-600 rounded-full mr-2"></span>
            {monthName} {currentYear} Duty Roster
          </h1>
          <Link href="/" className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors font-semibold text-center">Back to Roster</Link>
        </div>
        {loading ? (
          <div className="text-center text-green-700 text-base sm:text-lg font-medium flex flex-col items-center gap-2 py-8">
            <span className="text-3xl animate-spin">🌀</span>
            Loading...
          </div>
        ) : error ? (
          <div className="text-center text-red-600 text-base sm:text-lg font-medium py-8">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-green-300 rounded-xl overflow-hidden text-xs sm:text-sm md:text-base">
              <thead>
                <tr>
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
                    <th key={idx} className="px-2 sm:px-3 py-2 sm:py-3 border bg-green-100 text-green-700 font-semibold text-xs sm:text-base">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeks.map((week, wIdx) => (
                  <tr key={wIdx}>
                    {week.map((date, dIdx) => (
                      <td key={dIdx} className="align-top px-1 sm:px-2 py-2 border min-w-[90px] sm:min-w-[120px] bg-green-50 hover:bg-green-100 transition">
                        {date > 0 ? (
                          <div>
                            <div className="font-bold text-green-700 mb-1 text-xs sm:text-lg">{date}</div>
                            {calendar[date] && (
                              <div className="space-y-1">
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