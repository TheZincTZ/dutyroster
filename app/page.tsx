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
      <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-green-800">Duty Roster</h1>
          <div className="flex gap-2">
            <Link 
              href="/search" 
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Search Personnel
            </Link>
            <Link
              href="/extras"
              className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors"
            >
              View Extras Personnel
            </Link>
          </div>
        </div>
        <div className="mb-2 text-center text-green-700 text-xl font-semibold">
          {now.toLocaleString("en-US", { month: "long" })} {now.getDate()}, {now.getFullYear()}
        </div>
        <div className="mb-6 text-center text-green-700 text-lg">
          Current Time: <span className="font-mono">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>
        {/* AM Shift */}
        <div className="mb-8 p-4 rounded-lg border border-green-200 bg-green-50">
          <div className="text-lg font-bold text-green-700 mb-2">AM Shift (7:30am - 7:30pm)</div>
          <div className="mb-2"><span className="font-semibold text-green-700">AM:</span> <span className="text-green-800">{amEntry}</span></div>
          <div><span className="font-semibold text-red-700">Reserve AM:</span> <span className="text-red-700">{amReserve}</span></div>
        </div>
        {/* PM Shift */}
        <div className="mb-2 p-4 rounded-lg border border-green-200 bg-green-50">
          <div className="text-lg font-bold text-green-700 mb-2">PM Shift (7:30pm - 7:30am)</div>
          <div className="mb-2"><span className="font-semibold text-green-700">PM:</span> <span className="text-green-800">{pmEntry}</span></div>
          <div><span className="font-semibold text-red-700">Reserve PM:</span> <span className="text-red-700">{pmReserve}</span></div>
        </div>
      </div>
    </main>
  );
}
