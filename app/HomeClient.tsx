"use client";

import { useEffect, useState } from "react";
import { getRosterData, CalendarMap } from "./lib/db-access";
import Link from 'next/link';
import { renderName } from "./lib/renderName";

export default function HomeClient() {
  const [calendar, setCalendar] = useState<CalendarMap>({});
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [showPin, setShowPin] = useState(false);

  // Check if already authenticated (stored in sessionStorage)
  useEffect(() => {
    const authenticated = sessionStorage.getItem('dutyRosterAuthenticated');
    if (authenticated === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Load data from Supabase
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        // Get current month and year
        const now = new Date();
        const currentMonth = now.getMonth() + 1; // Convert to 1-based month
        const currentYear = now.getFullYear();
        
        const calendarData = await getRosterData(currentMonth, currentYear);
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

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = process.env.NEXT_PUBLIC_DUTY_ROSTER_PIN ;
    
    if (pin === correctPin) {
      setIsAuthenticated(true);
      sessionStorage.setItem('dutyRosterAuthenticated', 'true');
      setPinError("");
      setPin("");
    } else {
      setPinError("Incorrect PIN. Please try again.");
      setPin("");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('dutyRosterAuthenticated');
  };

  // PIN Entry Screen
  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-green-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-green-900 tracking-tight mb-2">
            Duty Roster
          </h1>
          <p className="text-green-700">Enter PIN to access the duty roster</p>
        </div>

        <form onSubmit={handlePinSubmit} className="space-y-6">
          <div>
            <label htmlFor="pin" className="block text-sm font-medium text-green-700 mb-2">
              PIN Code
            </label>
            <div className="relative">
              <input
                type={showPin ? "text" : "password"}
                id="pin"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full px-4 py-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-lg font-mono"
                placeholder="Enter PIN"
                maxLength={10}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600 hover:text-green-800"
              >
                {showPin ? "🙈" : "👁️"}
              </button>
            </div>
            {pinError && (
              <p className="mt-2 text-red-600 text-sm">{pinError}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Access Duty Roster
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Contact administrator for PIN access
          </p>
        </div>
      </div>
    );
  }

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
        <div className="flex items-center gap-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-green-900 tracking-tight flex items-center gap-2">
          <span className="inline-block w-2 h-6 sm:h-8 bg-green-600 rounded-full mr-2"></span>
          Duty Roster
        </h1>
          <button
            onClick={handleLogout}
            className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
            title="Logout"
          >
            🔒 Logout
          </button>
        </div>
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

      {/* Disclaimer Section */}
      <div className="mb-4 sm:mb-6 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
        <div className="flex items-start gap-2">
          <span className="text-yellow-700 text-xl">⚠️</span>
          <p className="text-yellow-800 font-medium">If duty clerk wants to swap duty, please inform OPS WO beforehand.</p>
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
        <div className="text-green-600 text-sm mt-2">
          Data last updated: {now.toLocaleDateString("en-US", { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
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
              <span className="text-green-800">{renderName(amEntry)}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-semibold text-black min-w-[80px]">Reserve AM:</span>
              <span className="text-black">{renderName(amReserve)}</span>
            </div>
          </div>
        </div>

        {/* PM Shift */}
        <div className="p-4 rounded-xl border border-green-200 bg-green-50 shadow-sm">
          <div className="text-base sm:text-lg font-bold text-green-700 mb-2">PM Shift (7:30pm - 7:30am)</div>
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-semibold text-green-700 min-w-[80px]">PM:</span>
              <span className="text-green-800">{renderName(pmEntry)}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-semibold text-black min-w-[80px]">Reserve PM:</span>
              <span className="text-black">{renderName(pmReserve)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 