"use client";

import { useEffect, useState } from "react";
import { getPointSystems, getAvailableMonths, getLastUploadTime } from "../lib/db-access";
import Link from "next/link";

type PointSystem = {
  id: number;
  unit: string;
  shift: string;
  name: string;
  points: number;
  months_valid: number;
  average_points: number;
};

export default function PointsystemClient() {
  const [points, setPoints] = useState<PointSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortDesc, setSortDesc] = useState(true);
  const [availableMonths, setAvailableMonths] = useState<{ month: number; year: number; monthName: string }[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<{ month: number; year: number } | null>(null);
  const [lastUploadTime, setLastUploadTime] = useState<string | null>(null);

  // Get current month and year
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load available months and last upload time
        const [months, uploadTime] = await Promise.all([
          getAvailableMonths(),
          getLastUploadTime()
        ]);
        setAvailableMonths(months);
        setLastUploadTime(uploadTime);
        
        // Set selected month to current month if available, otherwise to the most recent month
        if (months.length > 0) {
          const currentMonthData = months.find(m => m.month === currentMonth + 1 && m.year === currentYear);
          const targetMonth = currentMonthData ? { month: currentMonthData.month, year: currentMonthData.year } : { month: months[0].month, year: months[0].year };
          setSelectedMonth(targetMonth);
          
          // Load points data for selected month
          const pointsData = await getPointSystems(targetMonth.month, targetMonth.year);
          setPoints(pointsData || []);
        }
      } catch {
        setError("Failed to load point system data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentMonth, currentYear]);

  // Load points data when selected month changes
  useEffect(() => {
    if (selectedMonth) {
      loadPointsForMonth(selectedMonth.month, selectedMonth.year);
    }
  }, [selectedMonth]);

  const loadPointsForMonth = async (month: number, year: number) => {
    setLoading(true);
    try {
      const pointsData = await getPointSystems(month, year);
      setPoints(pointsData || []);
    } catch {
      setError("Failed to load point system data");
    } finally {
      setLoading(false);
    }
  };

  const renderTable = (unit: string, shift: string) => {
    const filtered = points.filter(p => p.unit === unit && p.shift === shift);
    if (filtered.length === 0) return (
      <div className="text-green-700 text-center py-4">No data for {unit} {shift}.</div>
    );
    const sorted = [...filtered].sort((a, b) => sortDesc ? b.points - a.points : a.points - b.points);
    return (
      <div className="w-full overflow-x-auto">
        <button
          className="mb-2 px-3 py-1 bg-green-200 text-green-900 rounded font-semibold hover:bg-green-300 transition"
          onClick={() => setSortDesc((prev) => !prev)}
        >
          Sort by Points: {sortDesc ? 'Highest to Lowest' : 'Lowest to Highest'}
        </button>
        <table className="w-full min-w-[500px] border border-green-200 rounded-xl overflow-hidden mb-6 text-xs sm:text-sm md:text-base">
          <thead>
            <tr className="bg-green-100">
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-green-700 font-semibold text-xs sm:text-lg whitespace-nowrap">Name</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-green-700 font-semibold text-xs sm:text-lg whitespace-nowrap">Points</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-green-700 font-semibold text-xs sm:text-lg whitespace-nowrap">Months Valid</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-green-700 font-semibold text-xs sm:text-lg whitespace-nowrap">Average Points</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, idx) => (
              <tr key={p.id} className={"border-t border-green-100 " + (idx % 2 === 0 ? "bg-green-50" : "bg-white") + " hover:bg-green-200 transition"}>
                <td className="px-2 sm:px-4 py-2 sm:py-3 text-green-900 font-medium text-xs sm:text-lg whitespace-nowrap">{p.name}</td>
                <td className="px-2 sm:px-4 py-2 sm:py-3 text-green-800 text-xs sm:text-lg whitespace-nowrap">{p.points}</td>
                <td className="px-2 sm:px-4 py-2 sm:py-3 text-green-800 text-xs sm:text-lg whitespace-nowrap">{p.months_valid}</td>
                <td className="px-2 sm:px-4 py-2 sm:py-3 text-green-800 text-xs sm:text-lg whitespace-nowrap">{p.average_points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <main className="min-h-screen p-4 sm:p-6 md:p-8 bg-green-50">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-4 sm:p-6 md:p-10 border border-green-100 overflow-x-hidden">
        <div className="mb-6 sm:mb-8">
          <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded-xl shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-green-700 text-xl sm:text-2xl mt-1">ℹ️</span>
              <div className="text-green-900 text-xs sm:text-base">
                <div className="font-bold mb-1">How the Point System Works:</div>
                <ul className="list-disc pl-5 space-y-1">
                  <li><span className="font-semibold">Friday PM shift, Weekend, and Public Holidays:</span> <span className="text-green-800">2 points per duty</span></li>
                  <li><span className="font-semibold">Weekday:</span> <span className="text-green-800">1 point per duty</span></li>
                  <li><span className="font-semibold">Last Minute Notice of Swaps (24 hours):</span> <span className="text-red-700">Extra +1 Point Deduction</span></li>
                  <li><span className="font-semibold">Late Reporting for Duty:</span> <span className="text-red-700">Extra +1 Point Deduction</span></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-4">
          <div className="flex items-center gap-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-green-900 tracking-tight flex items-center gap-2">
            <span className="inline-block w-2 h-6 sm:h-8 bg-green-600 rounded-full mr-2"></span>
            Point System
          </h1>
            <button
              onClick={() => {
                sessionStorage.removeItem('dutyRosterAuthenticated');
                window.location.href = '/';
              }}
              className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
              title="Logout"
            >
              🔒 Logout
            </button>
          </div>
          <Link href="/" className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors font-semibold text-center">Back to Roster</Link>
        </div>

        {/* Data Last Updated */}
        <div className="mb-4 text-center">
          <div className="text-green-600 text-sm">
            Data last updated: {lastUploadTime ? 
              new Date(lastUploadTime).toLocaleDateString("en-US", { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : 
              'No data available'
            }
          </div>
        </div>

        {/* Month Selector */}
        {availableMonths.length > 0 && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-3">Select Month to View:</h3>
            <div className="flex flex-wrap gap-2">
              {availableMonths.map((monthData) => (
                <button
                  key={`${monthData.year}-${monthData.month}`}
                  onClick={() => setSelectedMonth({ month: monthData.month, year: monthData.year })}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedMonth?.month === monthData.month && selectedMonth?.year === monthData.year
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-green-700 border border-green-300 hover:bg-green-100'
                  }`}
                >
                  {monthData.monthName}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center text-green-700 text-base sm:text-lg font-medium flex flex-col items-center gap-2 py-8">
            <span className="text-3xl animate-spin">🌀</span>
            Loading...
          </div>
        ) : error ? (
          <div className="text-center text-red-600 text-base sm:text-lg font-medium py-8">{error}</div>
        ) : (
          <div className="space-y-8 sm:space-y-10">
            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-green-800 mb-4 flex items-center gap-2">
                <span className="inline-block w-2 h-6 bg-green-700 rounded-full mr-2"></span>
                Brigade
              </h2>
              <div className="mb-6">
                <h3 className="text-base sm:text-xl font-semibold text-green-700 mb-2">Morning</h3>
                {renderTable("brigade", "morning")}
              </div>
              <div>
                <h3 className="text-base sm:text-xl font-semibold text-green-700 mb-2">Night</h3>
                {renderTable("brigade", "night")}
              </div>
            </section>
            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-green-800 mb-4 flex items-center gap-2">
                <span className="inline-block w-2 h-6 bg-green-900 rounded-full mr-2"></span>
                SSP
              </h2>
              <div className="mb-6">
                <h3 className="text-base sm:text-xl font-semibold text-green-700 mb-2">Morning</h3>
                {renderTable("ssp", "morning")}
              </div>
              <div>
                <h3 className="text-base sm:text-xl font-semibold text-green-700 mb-2">Night</h3>
                {renderTable("ssp", "night")}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
} 