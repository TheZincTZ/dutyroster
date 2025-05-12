"use client";

import { useEffect, useState } from "react";
import { getRosterData, RosterData } from "./lib/db";

type CalendarEntry = {
  AM: string;
  PM: string;
  ReserveAM: string;
  ReservePM: string;
};

type CalendarMap = { [date: number]: CalendarEntry };

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
      nextShift: "PM",
      nextDate: now.getDate(),
    };
  } else {
    // PM shift
    // If after 7:30pm, use today; if before 7:30am, use previous day
    let pmDate = now.getDate();
    if (now < amStart) {
      // Before 7:30am, PM shift is for previous day
      const prev = new Date(now);
      prev.setDate(now.getDate() - 1);
      pmDate = prev.getDate();
    }
    return {
      shift: "PM",
      shiftLabel: "PM Shift (7:30pm - 7:30am)",
      date: pmDate,
      nextShift: "AM",
      nextDate: now.getDate(),
    };
  }
}

export default function Home() {
  const [calendar, setCalendar] = useState<CalendarMap>({});
  const [now, setNow] = useState(new Date());
  const [shiftInfo, setShiftInfo] = useState(getShiftInfo(new Date()));
  const [loading, setLoading] = useState(true);

  // Load data from database
  useEffect(() => {
    const loadData = async () => {
      try {
        const rosterData = await getRosterData();
        if (rosterData.length > 0) {
          const calendarData: CalendarMap = {};
          
          rosterData.forEach(entry => {
            const date = new Date(entry.date);
            const day = date.getDate();
            calendarData[day] = {
              AM: entry.personnel,
              PM: entry.personnel,
              ReserveAM: entry.scoreboard,
              ReservePM: entry.scoreboard
            };
          });
          
          setCalendar(calendarData);
        }
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
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

  const amEntry = calendar[shiftInfo.date]?.AM || "";
  const pmEntry = calendar[shiftInfo.date]?.PM || "";
  const amReserve = calendar[shiftInfo.date]?.ReserveAM || "";
  const pmReserve = calendar[shiftInfo.date]?.ReservePM || "";

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
