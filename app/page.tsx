"use client";

import { useEffect, useState } from "react";
import { getRosterData, CalendarMap } from "./lib/supabase";
import Link from 'next/link';

export default function Home() {
  const [calendar, setCalendar] = useState<CalendarMap>({});
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(true);

  // Load data from Supabase
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        const calendarData = await getRosterData();
        if (isMounted) {
          setCalendar(calendarData);
        }
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Live clock update
  useEffect(() => {
    let isMounted = true;
    
    const updateTime = () => {
      if (isMounted) {
        setNow(new Date());
      }
    };

    const interval = setInterval(updateTime, 1000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Get the current date's personnel data
  const currentDate = now.getDate();
  const amEntry = calendar[currentDate]?.AM || "";
  const pmEntry = calendar[currentDate]?.PM || "";
  const amReserve = calendar[currentDate]?.ReserveAM || "";
  const pmReserve = calendar[currentDate]?.ReservePM || "";

  if (loading) {
    return (
      <main className="min-h-screen p-8 bg-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto mb-4"></div>
          <p className="text-green-700">Loading duty roster...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 bg-green-50 flex items-center justify-center">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl p-10 border border-green-100">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-4xl font-extrabold text-green-900 tracking-tight flex items-center gap-2">
            <span className="inline-block w-2 h-8 bg-green-600 rounded-full mr-2"></span>
            Duty Roster
          </h1>
          <div className="flex flex-wrap gap-2">
            <Link 
              href="/search" 
              className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors font-semibold"
            >
              Search Personnel
            </Link>
            <Link
              href="/extras"
              className="px-4 py-2 bg-green-700 text-white rounded-lg shadow hover:bg-green-800 transition-colors font-semibold"
            >
              View Extras Personnel
            </Link>
            <Link
              href="/monthlyschedule"
              className="px-4 py-2 bg-green-800 text-white rounded-lg shadow hover:bg-green-900 transition-colors font-semibold"
            >
              View Monthly Schedule
            </Link>
            <Link
              href="/todaytomorrow"
              className="px-4 py-2 bg-green-900 text-white rounded-lg shadow hover:bg-green-950 transition-colors font-semibold"
            >
              View Today & Tomorrow Duty
            </Link>
            <Link
              href="/pointsystem"
              className="px-4 py-2 bg-green-950 text-white rounded-lg shadow hover:bg-green-900 transition-colors font-semibold"
            >
              View Point System
            </Link>
          </div>
        </div>
        <div className="mb-2 text-center text-green-700 text-2xl font-bold tracking-wide">
          {now.toLocaleString("en-US", { month: "long" })} {now.getDate()}, {now.getFullYear()}
        </div>
        <div className="mb-6 text-center text-green-700 text-lg font-medium">
          Current Time: <span className="font-mono">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>
        {/* AM Shift */}
        <div className="mb-8 p-4 rounded-xl border border-green-200 bg-green-50 shadow-sm">
          <div className="text-lg font-bold text-green-700 mb-2">AM Shift (7:30am - 7:30pm)</div>
          <div className="mb-2"><span className="font-semibold text-green-700">AM:</span> <span className="text-green-800">{amEntry}</span></div>
          <div><span className="font-semibold text-red-700">Reserve AM:</span> <span className="text-red-700">{amReserve}</span></div>
        </div>
        {/* PM Shift */}
        <div className="mb-2 p-4 rounded-xl border border-green-200 bg-green-50 shadow-sm">
          <div className="text-lg font-bold text-green-700 mb-2">PM Shift (7:30pm - 7:30am)</div>
          <div className="mb-2"><span className="font-semibold text-green-700">PM:</span> <span className="text-green-800">{pmEntry}</span></div>
          <div><span className="font-semibold text-red-700">Reserve PM:</span> <span className="text-red-700">{pmReserve}</span></div>
        </div>
      </div>
    </main>
  );
}

export const metadata = {
  title: "Homepage"
};
