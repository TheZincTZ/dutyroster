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
      <div className="max-w-lg mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-green-800">Today&rsquo;s &amp; Tomorrow&rsquo;s Duty</h1>
          <Link href="/" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Back to Roster</Link>
        </div>
        {loading ? (
          <div className="text-center text-green-700">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-green-700 mb-2">
                Today ({todayDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })})
              </h2>
              {todayEntry ? (
                <div className="space-y-1">
                  <div><span className="font-semibold text-green-700">AM:</span> <span className="text-green-800">{todayEntry.AM}</span></div>
                  <div><span className="font-semibold text-green-700">PM:</span> <span className="text-green-800">{todayEntry.PM}</span></div>
                  <div><span className="font-semibold text-red-700">Reserve AM:</span> <span className="text-red-700">{todayEntry.ReserveAM}</span></div>
                  <div><span className="font-semibold text-red-700">Reserve PM:</span> <span className="text-red-700">{todayEntry.ReservePM}</span></div>
                </div>
              ) : (
                <div className="text-green-700">No duty data for today.</div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-green-700 mb-2">
                Tomorrow ({tomorrowDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })})
              </h2>
              {tomorrowEntry ? (
                <div className="space-y-1">
                  <div><span className="font-semibold text-green-700">AM:</span> <span className="text-green-800">{tomorrowEntry.AM}</span></div>
                  <div><span className="font-semibold text-green-700">PM:</span> <span className="text-green-800">{tomorrowEntry.PM}</span></div>
                  <div><span className="font-semibold text-red-700">Reserve AM:</span> <span className="text-red-700">{tomorrowEntry.ReserveAM}</span></div>
                  <div><span className="font-semibold text-red-700">Reserve PM:</span> <span className="text-red-700">{tomorrowEntry.ReservePM}</span></div>
                </div>
              ) : (
                <div className="text-green-700">No duty data for tomorrow.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 