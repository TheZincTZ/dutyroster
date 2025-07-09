"use client";

import { useEffect, useState } from "react";
import { getRosterData, CalendarMap } from "../lib/db-access";
import Link from "next/link";
import { renderName } from "../lib/renderName";

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
  
  // Build 5-week calendar grid always starting from Sunday
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const firstDayOfWeek = firstDayOfMonth.getDay(); // 0=Sun, 1=Mon, ...
  
  // Calculate the Sunday that starts the first week of the month
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - firstDayOfWeek);
  
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
                    {week.map((dayInfo, dIdx) => (
                      <td key={dIdx} className={`align-top px-1 sm:px-2 py-2 border min-w-[90px] sm:min-w-[120px] transition ${
                        dayInfo.isCurrentMonth ? 'bg-green-50 hover:bg-green-100' : 'bg-gray-50'
                      }`}>
                        <div>
                          <div className={`font-bold mb-1 text-xs sm:text-lg ${
                            dayInfo.isCurrentMonth ? 'text-green-700' : 'text-gray-400'
                          }`}>
                            {dayInfo.date}
                          </div>
                          {dayInfo.isCurrentMonth && calendar[dayInfo.date] && (
                            <div className="space-y-1">
                              <div><span className="font-semibold text-green-700">AM:</span> <span className="text-green-800">{renderName(calendar[dayInfo.date].AM)}</span></div>
                              <div className="text-xs"><span className="font-semibold text-black">Res AM:</span> <span className="text-black">{renderName(calendar[dayInfo.date].ReserveAM)}</span></div>
                              <div><span className="font-semibold text-green-700">PM:</span> <span className="text-green-800">{renderName(calendar[dayInfo.date].PM)}</span></div>
                              <div className="text-xs"><span className="font-semibold text-black">Res PM:</span> <span className="text-black">{renderName(calendar[dayInfo.date].ReservePM)}</span></div>
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
        )}
      </div>
    </main>
  );
} 