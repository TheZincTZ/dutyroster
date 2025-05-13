"use client";

import { useState, useEffect } from "react";
import { getRosterData, CalendarMap } from "../lib/supabase";
import Link from 'next/link';

type DutyEntry = {
  date: number;
  shift: string;
  type: string;
};

export default function SearchPage() {
  const [calendar, setCalendar] = useState<CalendarMap>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DutyEntry[]>([]);
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

  // Search function
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const results: DutyEntry[] = [];

    // Search through all dates
    Object.entries(calendar).forEach(([date, entry]) => {
      const dateNum = parseInt(date);
      
      // Check AM shift
      if (entry.AM.toLowerCase().includes(query)) {
        results.push({
          date: dateNum,
          shift: "AM",
          type: "Primary"
        });
      }
      if (entry.ReserveAM.toLowerCase().includes(query)) {
        results.push({
          date: dateNum,
          shift: "AM",
          type: "Reserve"
        });
      }
      
      // Check PM shift
      if (entry.PM.toLowerCase().includes(query)) {
        results.push({
          date: dateNum,
          shift: "PM",
          type: "Primary"
        });
      }
      if (entry.ReservePM.toLowerCase().includes(query)) {
        results.push({
          date: dateNum,
          shift: "PM",
          type: "Reserve"
        });
      }
    });

    setSearchResults(results);
  };

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
    <main className="min-h-screen p-8 bg-green-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-green-800">Search Personnel</h1>
          <Link 
            href="/" 
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Back to Roster
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter personnel name..."
              className="flex-1 px-4 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-green-900 placeholder-green-400"
            />
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Search
            </button>
          </div>
        </div>

        {searchResults.length > 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-green-800 mb-4">
              Found {searchResults.length} duties for <span className="text-green-900 font-bold">&ldquo;{searchQuery}&rdquo;</span>
            </h2>
            <div className="space-y-4">
              {searchResults.map((result, index) => (
                <div 
                  key={index}
                  className="p-4 border border-green-200 rounded-lg bg-green-50"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-green-700">May {result.date}:</span>
                      <span className="ml-2 text-green-800">
                        {result.shift} Shift ({result.type})
                      </span>
                    </div>
                    <div className="text-sm text-green-600">
                      {result.shift === "AM" ? "7:30am - 7:30pm" : "7:30pm - 7:30am"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : searchQuery ? (
          <div className="bg-white rounded-lg shadow-lg p-6 text-center text-green-700">
            No duties found for <span className="text-green-900 font-bold">&ldquo;{searchQuery}&rdquo;</span>
          </div>
        ) : null}
      </div>
    </main>
  );
} 