"use client";

import { useEffect, useState } from "react";
import { getRosterData, CalendarMap } from "../lib/db-access";
import Link from "next/link";
import { renderName } from "../lib/renderName";

function getDateKey(date: Date) {
  return date.getDate();
}

export default function TodayTomorrowClient() {
  const [calendar, setCalendar] = useState<CalendarMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [today] = useState(new Date());

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

  // Calculate today and tomorrow
  const todayDate = today;
  const tomorrowDate = new Date(today);
  tomorrowDate.setDate(today.getDate() + 1);

  const todayKey = getDateKey(todayDate);
  const tomorrowKey = getDateKey(tomorrowDate);

  const todayEntry = calendar[todayKey];
  const tomorrowEntry = calendar[tomorrowKey];

  return (
    <main className="min-h-screen p-4 sm:p-6 md:p-8 bg-green-50">
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-2xl p-4 sm:p-6 md:p-10 border border-green-100">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-green-900 tracking-tight flex items-center gap-2">
            <span className="inline-block w-2 h-6 sm:h-8 bg-green-600 rounded-full mr-2"></span>
            Today&rsquo;s &amp; Tomorrow&rsquo;s Duty
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
          <div className="space-y-8 sm:space-y-10">
            <div className="bg-green-50 rounded-xl p-4 sm:p-6 shadow-sm">
              <h2 className="text-xl sm:text-2xl font-bold text-green-700 mb-4 flex items-center gap-2">
                <span className="inline-block w-2 h-6 bg-green-600 rounded-full mr-2"></span>
                Today ({todayDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })})
              </h2>
              {todayEntry ? (
                <div className="space-y-2">
                  <div><span className="font-semibold text-green-700">AM:</span> <span className="text-green-800">{renderName(todayEntry.AM)}</span></div>
                  <div><span className="font-semibold text-green-700">PM:</span> <span className="text-green-800">{renderName(todayEntry.PM)}</span></div>
                  <div><span className="font-semibold text-red-700">Reserve AM:</span> <span className="text-red-700">{renderName(todayEntry.ReserveAM)}</span></div>
                  <div><span className="font-semibold text-red-700">Reserve PM:</span> <span className="text-red-700">{renderName(todayEntry.ReservePM)}</span></div>
                </div>
              ) : (
                <div className="text-green-700 flex items-center gap-2"><span>📅</span>No duty data for today.</div>
              )}
            </div>
            <div className="bg-green-50 rounded-xl p-4 sm:p-6 shadow-sm">
              <h2 className="text-xl sm:text-2xl font-bold text-green-700 mb-4 flex items-center gap-2">
                <span className="inline-block w-2 h-6 bg-green-600 rounded-full mr-2"></span>
                Tomorrow ({tomorrowDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })})
              </h2>
              {tomorrowEntry ? (
                <div className="space-y-2">
                  <div><span className="font-semibold text-green-700">AM:</span> <span className="text-green-800">{renderName(tomorrowEntry.AM)}</span></div>
                  <div><span className="font-semibold text-green-700">PM:</span> <span className="text-green-800">{renderName(tomorrowEntry.PM)}</span></div>
                  <div><span className="font-semibold text-red-700">Reserve AM:</span> <span className="text-red-700">{renderName(tomorrowEntry.ReserveAM)}</span></div>
                  <div><span className="font-semibold text-red-700">Reserve PM:</span> <span className="text-red-700">{renderName(tomorrowEntry.ReservePM)}</span></div>
                </div>
              ) : (
                <div className="text-green-700 flex items-center gap-2"><span>📅</span>No duty data for tomorrow.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 