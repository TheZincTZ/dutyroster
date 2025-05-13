"use client";

import { useEffect, useState } from "react";
import { getRosterData, CalendarMap } from "../lib/supabase";
import Link from "next/link";
import Head from "next/head";

export default function MonthlySchedule() {
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
      <Head>
        <title>Monthly Roster</title>
      </Head>
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl p-10 border border-green-100">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-4xl font-extrabold text-green-900 tracking-tight flex items-center gap-2">
            <span className="inline-block w-2 h-8 bg-green-600 rounded-full mr-2"></span>
            May 2025 Duty Roster
          </h1>
          <Link href="/" className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors font-semibold">Back to Roster</Link>
        </div>
        {loading ? (
          <div className="text-center text-green-700 text-lg font-medium flex flex-col items-center gap-2">
            <span className="text-3xl animate-spin">🌀</span>
            Loading...
          </div>
        ) : error ? (
          <div className="text-center text-red-600 text-lg font-medium">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-green-300 rounded-xl overflow-hidden">
              <thead>
                <tr>
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
                    <th key={idx} className="px-2 py-3 border bg-green-100 text-base font-semibold text-green-700">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeks.map((week, wIdx) => (
                  <tr key={wIdx}>
                    {week.map((date, dIdx) => (
                      <td key={dIdx} className="align-top px-2 py-2 border min-w-[120px] bg-green-50 hover:bg-green-100 transition">
                        {date > 0 ? (
                          <div>
                            <div className="font-bold text-green-700 mb-1 text-lg">{date}</div>
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