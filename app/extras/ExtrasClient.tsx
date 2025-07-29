"use client";

import { useEffect, useState } from "react";
import { getExtrasPersonnel, getAvailableMonths } from "../lib/db-access";
import Link from "next/link";

type ExtrasPersonnel = {
  id: number;
  name: string;
  number: number;
};

export default function ExtrasClient() {
  const [extras, setExtras] = useState<ExtrasPersonnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableMonths, setAvailableMonths] = useState<{ month: number; year: number; monthName: string }[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<{ month: number; year: number } | null>(null);

  // Get current month and year
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load available months (includes all months from current through December)
        const months = await getAvailableMonths();
        setAvailableMonths(months);
        
        // Set selected month to current month if available, otherwise to the most recent month
        if (months.length > 0) {
          const currentMonthData = months.find(m => m.month === currentMonth + 1 && m.year === currentYear);
          const targetMonth = currentMonthData ? { month: currentMonthData.month, year: currentMonthData.year } : { month: months[0].month, year: months[0].year };
          setSelectedMonth(targetMonth);
          
          // Load extras data for selected month
          const extrasData = await getExtrasPersonnel(targetMonth.month, targetMonth.year);
          setExtras(extrasData || []);
        }
      } catch {
        setError("Failed to load extras personnel");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentMonth, currentYear]);

  // Load extras data when selected month changes
  useEffect(() => {
    if (selectedMonth) {
      loadExtrasForMonth(selectedMonth.month, selectedMonth.year);
    }
  }, [selectedMonth]);

  const loadExtrasForMonth = async (month: number, year: number) => {
    setLoading(true);
    try {
      const extrasData = await getExtrasPersonnel(month, year);
      setExtras(extrasData || []);
    } catch {
      setError("Failed to load extras personnel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-4 sm:p-6 md:p-8 bg-green-50">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-4 sm:p-6 md:p-10 border border-green-100">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-4">
          <div className="flex items-center gap-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-green-900 tracking-tight flex items-center gap-2">
            <span className="inline-block w-2 h-6 sm:h-8 bg-green-600 rounded-full mr-2"></span>
            Extras Personnel
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
          <Link 
            href="/" 
            className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors font-semibold text-center"
          >
            Back to Roster
          </Link>
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
        {loading && (
          <div className="text-center text-green-700 text-base sm:text-lg font-medium flex flex-col items-center gap-2 py-8">
            <span className="text-2xl sm:text-3xl animate-spin">🌀</span>
            Loading...
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center text-red-600 text-base sm:text-lg font-medium py-8">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && extras.length === 0 && (
          <div className="text-center text-green-700 text-base sm:text-lg font-medium flex flex-col items-center gap-2 py-8">
            <span className="text-2xl sm:text-3xl">👤</span>
            No extras personnel found.
          </div>
        )}

        {/* Data Table */}
        {!loading && !error && extras.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-green-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-green-100">
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-green-700 font-semibold text-base sm:text-lg">Name</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-green-700 font-semibold text-base sm:text-lg">Number</th>
                </tr>
              </thead>
              <tbody>
                {extras.map((person, idx) => (
                  <tr 
                    key={person.id} 
                    className={"border-t border-green-100 " + (idx % 2 === 0 ? "bg-green-50" : "bg-white") + " hover:bg-green-200 transition"}
                  >
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-green-900 font-medium text-base sm:text-lg">
                      {person.name}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-green-800 text-base sm:text-lg">
                      {person.number}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Mobile-Friendly Summary */}
        <div className="mt-6 text-center text-green-700 text-sm sm:text-base">
          <p>Total Personnel: <span className="font-semibold">{extras.length}</span></p>
        </div>
      </div>
    </main>
  );
} 