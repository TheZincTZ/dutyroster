"use client";

import { useEffect, useState } from "react";
import { getRosterData, CalendarMap } from "../lib/supabase";
import Link from "next/link";

function getDateKey(date: Date) {
  // Assumes May 2025, but can be adapted for other months
  // If you want to support other months, adjust accordingly
  return date.getDate();
}

export default function TodayTomorrowPage() {
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
    <main className="min-h-screen p-8 bg-green-50">
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-2xl p-10 border border-green-100">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-extrabold text-green-900 tracking-tight flex items-center gap-2">
            <span className="inline-block w-2 h-8 bg-green-600 rounded-full mr-2"></span>
            Today&rsquo;s &amp; Tomorrow&rsquo;s Duty
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
          <div className="space-y-10">
            <div className="bg-green-50 rounded-xl p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-green-700 mb-4 flex items-center gap-2">
                <span className="inline-block w-2 h-6 bg-green-600 rounded-full mr-2"></span>
                Today ({todayDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })})
              </h2>
              {todayEntry ? (
                <div className="space-y-2">
                  <div><span className="font-semibold text-green-700">AM:</span> <span className="text-green-800">{todayEntry.AM}</span></div>
                  <div><span className="font-semibold text-green-700">PM:</span> <span className="text-green-800">{todayEntry.PM}</span></div>
                  <div><span className="font-semibold text-red-700">Reserve AM:</span> <span className="text-red-700">{todayEntry.ReserveAM}</span></div>
                  <div><span className="font-semibold text-red-700">Reserve PM:</span> <span className="text-red-700">{todayEntry.ReservePM}</span></div>
                </div>
              ) : (
                <div className="text-green-700 flex items-center gap-2"><span>📅</span>No duty data for today.</div>
              )}
            </div>
            <div className="bg-green-50 rounded-xl p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-green-700 mb-4 flex items-center gap-2">
                <span className="inline-block w-2 h-6 bg-green-600 rounded-full mr-2"></span>
                Tomorrow ({tomorrowDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })})
              </h2>
              {tomorrowEntry ? (
                <div className="space-y-2">
                  <div><span className="font-semibold text-green-700">AM:</span> <span className="text-green-800">{tomorrowEntry.AM}</span></div>
                  <div><span className="font-semibold text-green-700">PM:</span> <span className="text-green-800">{tomorrowEntry.PM}</span></div>
                  <div><span className="font-semibold text-red-700">Reserve AM:</span> <span className="text-red-700">{tomorrowEntry.ReserveAM}</span></div>
                  <div><span className="font-semibold text-red-700">Reserve PM:</span> <span className="text-red-700">{tomorrowEntry.ReservePM}</span></div>
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

export const metadata = {
  title: "Current & Upcoming Duty"
}; 