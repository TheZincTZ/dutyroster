"use client";

import { useEffect, useState } from "react";
import { getRosterData, CalendarMap, getAvailableMonths, getLastUploadTime } from "../lib/db-access";
import Link from "next/link";
import { renderName } from "../lib/renderName";

export default function MonthlyscheduleClient() {
  const [calendar, setCalendar] = useState<CalendarMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
          
          // Load calendar data for selected month
          const calendarData = await getRosterData(targetMonth.month, targetMonth.year);
        setCalendar(calendarData);
        }
      } catch {
        setError("Failed to load duty roster");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentMonth, currentYear]);

  // Load calendar data when selected month changes
  useEffect(() => {
    if (selectedMonth) {
      loadCalendarForMonth(selectedMonth.month, selectedMonth.year);
    }
  }, [selectedMonth]);

  const loadCalendarForMonth = async (month: number, year: number) => {
    setLoading(true);
    try {
      const calendarData = await getRosterData(month, year);
      setCalendar(calendarData);
    } catch {
      setError("Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (month: number): string => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[month - 1] || 'Unknown';
  };
  
  // Build 5-week calendar grid always starting from Monday
  // Use selectedMonth if available, otherwise use current month
  const displayMonth = selectedMonth ? selectedMonth.month - 1 : currentMonth; // Convert to 0-based
  const displayYear = selectedMonth ? selectedMonth.year : currentYear;
  
  const firstDayOfMonth = new Date(displayYear, displayMonth, 1);
  const firstDayOfWeek = firstDayOfMonth.getDay(); // 0=Sun, 1=Mon, ...
  
  // Calculate the Monday that starts the first week of the month
  const startDate = new Date(firstDayOfMonth);
  const daysToSubtract = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Convert Sunday=0 to Monday=0
  startDate.setDate(startDate.getDate() - daysToSubtract);
  
  type DayInfo = { date: number; isCurrentMonth: boolean; month: number; year: number };
  const weeks: DayInfo[][] = [];
  
  // Generate 5 weeks
  for (let week = 0; week < 5; week++) {
    const weekData: DayInfo[] = [];
    
    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + (week * 7) + day);
      
      weekData.push({
        date: currentDate.getDate(),
        isCurrentMonth: currentDate.getMonth() === displayMonth,
        month: currentDate.getMonth(),
        year: currentDate.getFullYear()
      });
    }
    
    weeks.push(weekData);
  }

  return (
    <main className="min-h-screen p-4 sm:p-6 md:p-8 bg-green-50">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-2xl p-4 sm:p-6 md:p-10 border border-green-100">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-4">
          <div className="flex items-center gap-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-green-900 tracking-tight flex items-center gap-2">
            <span className="inline-block w-2 h-6 sm:h-8 bg-green-600 rounded-full mr-2"></span>
              Monthly Schedule
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

        {/* Calendar Display */}
        {selectedMonth && (
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-green-800 mb-6 text-center">
              {getMonthName(selectedMonth.month)} {selectedMonth.year} Duty Roster
            </h2>
            
            {loading ? (
              <div className="text-center text-green-700 text-lg font-medium flex flex-col items-center gap-2 py-8">
            <span className="text-3xl animate-spin">🌀</span>
                Loading calendar...
          </div>
        ) : error ? (
              <div className="text-center text-red-600 text-lg font-medium py-8">{error}</div>
        ) : (
          <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-green-300 bg-white rounded-lg overflow-hidden shadow-lg">
              <thead>
                    <tr className="bg-green-600 text-white">
                      <th className="p-2 sm:p-3 text-center font-bold text-xs sm:text-base">Mon</th>
                      <th className="p-2 sm:p-3 text-center font-bold text-xs sm:text-base">Tue</th>
                      <th className="p-2 sm:p-3 text-center font-bold text-xs sm:text-base">Wed</th>
                      <th className="p-2 sm:p-3 text-center font-bold text-xs sm:text-base">Thu</th>
                      <th className="p-2 sm:p-3 text-center font-bold text-xs sm:text-base">Fri</th>
                      <th className="p-2 sm:p-3 text-center font-bold text-xs sm:text-base">Sat</th>
                      <th className="p-2 sm:p-3 text-center font-bold text-xs sm:text-base">Sun</th>
                </tr>
              </thead>
              <tbody>
                {weeks.map((week, wIdx) => (
                  <tr key={wIdx}>
                        {week.map((dayInfo, dIdx) => (
                          <td key={dIdx} className={`align-top px-1 sm:px-2 py-2 border min-w-[90px] sm:min-w-[120px] transition ${
                            dayInfo.isCurrentMonth ? 'bg-green-50 hover:bg-green-100' : 'bg-gray-50'
                          }`}>
                          <div>
                              <div className={`font-bold mb-1 text-xs sm:text-lg ${
                                dayInfo.isCurrentMonth ? 'text-green-700' : 'text-gray-400'
                              }`}>
                                {dayInfo.date}
                              </div>
                              {dayInfo.isCurrentMonth && calendar[dayInfo.date] && (
                              <div className="space-y-1">
                                  <div><span className="font-semibold text-green-700">AM:</span> <span className="text-green-800">{renderName(calendar[dayInfo.date].AM)}</span></div>
                                  <div className="text-xs"><span className="font-semibold text-black">Res AM:</span> <span className="text-black">{renderName(calendar[dayInfo.date].ReserveAM)}</span></div>
                                  <div><span className="font-semibold text-green-700">PM:</span> <span className="text-green-800">{renderName(calendar[dayInfo.date].PM)}</span></div>
                                  <div className="text-xs"><span className="font-semibold text-black">Res PM:</span> <span className="text-black">{renderName(calendar[dayInfo.date].ReservePM)}</span></div>
                              </div>
                            )}
                          </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
              </div>
            )}
          </div>
        )}

        {availableMonths.length === 0 && !loading && (
          <div className="text-center text-green-700 text-lg font-medium py-8">
            No roster data available. Please upload data through the admin panel.
          </div>
        )}
      </div>
    </main>
  );
} 