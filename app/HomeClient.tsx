"use client";

import { useEffect, useState } from "react";
import { getRosterData, CalendarMap } from "./lib/db-access";
import Link from 'next/link';

export default function HomeClient() {
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
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto mb-4"></div>
        <p className="text-green-700">Loading duty roster...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-4 sm:p-6 md:p-10 border border-green-100">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-green-900 tracking-tight flex items-center gap-2">
          <span className="inline-block w-2 h-6 sm:h-8 bg-green-600 rounded-full mr-2"></span>
          Duty Roster
        </h1>
        <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
          <Link 
            href="/search" 
            className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors font-semibold text-center"
          >
            Search Personnel
          </Link>
          <Link
            href="/extras"
            className="w-full sm:w-auto px-4 py-2 bg-green-700 text-white rounded-lg shadow hover:bg-green-800 transition-colors font-semibold text-center"
          >
            View Extras Personnel
          </Link>
          <Link
            href="/monthlyschedule"
            className="w-full sm:w-auto px-4 py-2 bg-green-800 text-white rounded-lg shadow hover:bg-green-900 transition-colors font-semibold text-center"
          >
            View Monthly Schedule
          </Link>
          <Link
            href="/todaytomorrow"
            className="w-full sm:w-auto px-4 py-2 bg-green-900 text-white rounded-lg shadow hover:bg-green-950 transition-colors font-semibold text-center"
          >
            View Today & Tomorrow Duty
          </Link>
          <Link
            href="/pointsystem"
            className="w-full sm:w-auto px-4 py-2 bg-green-950 text-white rounded-lg shadow hover:bg-green-900 transition-colors font-semibold text-center"
          >
            View Point System
          </Link>
        </div>
      </div>

      {/* Date and Time Section */}
      <div className="mb-4 sm:mb-6 text-center">
        <div className="text-green-700 text-xl sm:text-2xl font-bold tracking-wide mb-2">
          {now.toLocaleString("en-US", { month: "long" })} {now.getDate()}, {now.getFullYear()}
        </div>
        <div className="text-green-700 text-base sm:text-lg font-medium">
          Current Time: <span className="font-mono">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>
      </div>

      {/* Shifts Section */}
      <div className="space-y-4 sm:space-y-6">
        {/* AM Shift */}
        <div className="p-4 rounded-xl border border-green-200 bg-green-50 shadow-sm">
          <div className="text-base sm:text-lg font-bold text-green-700 mb-2">AM Shift (7:30am - 7:30pm)</div>
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-semibold text-green-700 min-w-[80px]">AM:</span>
              <span className="text-green-800">{amEntry}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-semibold text-red-700 min-w-[80px]">Reserve AM:</span>
              <span className="text-red-700">{amReserve}</span>
            </div>
          </div>
        </div>

        {/* PM Shift */}
        <div className="p-4 rounded-xl border border-green-200 bg-green-50 shadow-sm">
          <div className="text-base sm:text-lg font-bold text-green-700 mb-2">PM Shift (7:30pm - 7:30am)</div>
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-semibold text-green-700 min-w-[80px]">PM:</span>
              <span className="text-green-800">{pmEntry}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-semibold text-red-700 min-w-[80px]">Reserve PM:</span>
              <span className="text-red-700">{pmReserve}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 