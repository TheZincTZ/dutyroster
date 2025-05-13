"use client";

import { useEffect, useState } from "react";
import { getRosterData, CalendarMap } from "./lib/supabase";
import { initDatabase } from "./lib/init-db";

function getShiftInfo(now: Date) {
  // AM: 7:30am - 7:29pm, PM: 7:30pm - 7:29am next day
  const amStart = new Date(now);
  amStart.setHours(7, 30, 0, 0);
  const pmStart = new Date(now);
  pmStart.setHours(19, 30, 0, 0);

  if (now >= amStart && now < pmStart) {
    // AM shift
    return {
      shift: "AM",
      shiftLabel: "AM Shift (7:30am - 7:30pm)",
      date: now.getDate(),
      month: now.getMonth(),
      year: now.getFullYear(),
      nextShift: "PM",
      nextDate: now.getDate(),
      nextMonth: now.getMonth(),
      nextYear: now.getFullYear(),
    };
  } else {
    // PM shift
    // If after 7:30pm, use today; if before 7:30am, use previous day
    const pmDate = new Date(now);
    if (now < amStart) {
      // Before 7:30am, PM shift is for previous day
      pmDate.setDate(now.getDate() - 1);
    }
    return {
      shift: "PM",
      shiftLabel: "PM Shift (7:30pm - 7:30am)",
      date: pmDate.getDate(),
      month: pmDate.getMonth(),
      year: pmDate.getFullYear(),
      nextShift: "AM",
      nextDate: now.getDate(),
      nextMonth: now.getMonth(),
      nextYear: now.getFullYear(),
    };
  }
}

export default function Home() {
  const [calendar, setCalendar] = useState<CalendarMap>({});
  const [now, setNow] = useState(new Date());
  const [shiftInfo, setShiftInfo] = useState(getShiftInfo(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize database and load data
  useEffect(() => {
    const initializeAndLoadData = async () => {
      try {
        console.log('Initializing database...');
        const dbInitialized = await initDatabase();
        
        if (!dbInitialized) {
          setError('Database not initialized. Please contact the administrator.');
          setLoading(false);
          return;
        }

        console.log('Loading data...');
        const calendarData = await getRosterData();
        console.log('Loaded calendar data:', calendarData);
        setCalendar(calendarData);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load roster data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    initializeAndLoadData();
  }, []);

  // Live clock and shift update
  useEffect(() => {
    const interval = setInterval(() => {
      const newNow = new Date();
      setNow(newNow);
      setShiftInfo(getShiftInfo(newNow));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Get the current date as a string (just the day number)
  const currentDateKey = String(shiftInfo.date);
  console.log('Current date key:', currentDateKey);
  console.log('All calendar keys:', Object.keys(calendar));
  console.log('Calendar data for current date:', calendar[currentDateKey]);

  // Get the data for the current date
  const currentData = calendar[currentDateKey] || {
    AM: "",
    PM: "",
    ReserveAM: "",
    ReservePM: ""
  };

  const amEntry = currentData.AM;
  const pmEntry = currentData.PM;
  const amReserve = currentData.ReserveAM;
  const pmReserve = currentData.ReservePM;

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

  if (error) {
    return (
      <main className="min-h-screen p-8 bg-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <p className="text-green-700">Please try again later or contact the administrator.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 bg-green-50 flex items-center justify-center">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-green-800 text-center">Duty Roster</h1>
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
