"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/db-access";
import Link from "next/link";

type Duty = {
  date: number;
  shift: string;
  type: string;
  isExtra: boolean;
};

interface RosterRow {
  date: number;
  AM?: string;
  PM?: string;
  ReserveAM?: string;
  ReservePM?: string;
  am?: string;
  pm?: string;
  reserve_am?: string;
  reserve_pm?: string;
}

export default function SearchClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [allNames, setAllNames] = useState<string[]>([]);
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [results, setResults] = useState<Duty[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [rosterData, setRosterData] = useState<RosterRow[]>([]);

  // Helper to extract all names from a cell, returning both the clean name and if it's extra
  function extractNamesWithExtra(cell: string): { name: string, isExtra: boolean }[] {
    if (!cell) return [];
    return cell
      .split(/,|&/)
      .map((n) => n.trim())
      .filter((n) => n.length > 0)
      .map((n) => ({
        name: n.replace(/\s*\(EXTRA\)\s*$/i, '').toLowerCase(),
        isExtra: /\(EXTRA\)$/i.test(n)
      }));
  }

  // Load all unique personnel names on mount
  useEffect(() => {
    const fetchRoster = async () => {
      setError(null);
      try {
        // Get current month and year
        const now = new Date();
        const currentMonth = now.getMonth() + 1; // Convert to 1-based month
        const currentYear = now.getFullYear();
        
        const { data, error } = await supabase
          .from("roster_data")
          .select("*")
          .eq('month', currentMonth)
          .eq('year', currentYear);
        if (error) throw error;
        setRosterData(data || []);
        // Extract all unique names from all fields
        const nameSet = new Set<string>();
        data?.forEach((row: RosterRow) => {
          [
            row.AM ?? row.am,
            row.PM ?? row.pm,
            row.ReserveAM ?? row.reserve_am,
            row.ReservePM ?? row.reserve_pm
          ].filter((cell): cell is string => typeof cell === 'string').forEach((cell) => {
            extractNamesWithExtra(cell).forEach(({ name }) => nameSet.add(name));
          });
        });
        setAllNames(Array.from(nameSet));
      } catch {
        setError("Failed to load roster data");
      }
    };
    fetchRoster();
  }, []);

  // Update name suggestions as user types
  useEffect(() => {
    if (!searchTerm) {
      setNameSuggestions([]);
      setSelectedName(null);
      setResults([]);
      return;
    }
    const search = searchTerm.trim().toLowerCase();
    const suggestions = allNames.filter((name) =>
      name.includes(search)
    );
    setNameSuggestions(suggestions);
    setSelectedName(null);
    setResults([]);
  }, [searchTerm, allNames]);

  // When a name is selected, find all duties for that name, and indicate if it's an extra
  useEffect(() => {
    if (!selectedName) return;
    const duties: Duty[] = [];
    const searchName = selectedName.trim().toLowerCase();
    rosterData.forEach((day) => {
      const am = day.AM ?? day.am ?? '';
      const pm = day.PM ?? day.pm ?? '';
      const reserveAM = day.ReserveAM ?? day.reserve_am ?? '';
      const reservePM = day.ReservePM ?? day.reserve_pm ?? '';
      const check = (cell: string, shift: string, type: string) => {
        extractNamesWithExtra(cell).forEach(({ name, isExtra }) => {
          if (name === searchName) {
            duties.push({ date: day.date, shift, type, isExtra });
      }
        });
      };
      check(am, "AM", "Primary");
      check(pm, "PM", "Primary");
      check(reserveAM, "AM", "Reserve");
      check(reservePM, "PM", "Reserve");
    });
    setResults(duties);
  }, [selectedName, rosterData]);

  const handleSuggestionClick = (name: string) => {
    setSelectedName(name);
    setSearchTerm(name);
    setNameSuggestions([]);
  };

  return (
    <main className="min-h-screen p-4 sm:p-6 md:p-8 bg-green-50">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-4 sm:p-6 md:p-10 border border-green-100">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-4">
          <div className="flex items-center gap-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-green-900 tracking-tight flex items-center gap-2">
            <span className="inline-block w-2 h-6 sm:h-8 bg-green-600 rounded-full mr-2"></span>
            Search Personnel
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

        {/* Search Form */}
        <form
          onSubmit={e => {
            e.preventDefault();
            // If searchTerm matches a name exactly, select it
            const exactMatch = allNames.find(
              (name) => name.toLowerCase() === searchTerm.trim().toLowerCase()
            );
            if (exactMatch) {
              handleSuggestionClick(exactMatch);
              return;
            }
            // If there are suggestions, select the first
            if (nameSuggestions.length > 0) {
              handleSuggestionClick(nameSuggestions[0]);
              return;
            }
            // Otherwise, show no duties found for the search term
            setSelectedName(searchTerm.trim());
            setResults([]);
          }}
          className="mb-6 sm:mb-8 relative"
        >
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter personnel name..."
              className="flex-1 px-4 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-base sm:text-lg text-green-900 placeholder-green-400"
              autoComplete="off"
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors font-semibold text-center"
            >
              Search
            </button>
          </div>
          {/* Suggestions dropdown */}
          {nameSuggestions.length > 0 && (
            <ul className="absolute z-10 left-0 right-0 bg-white border border-green-200 rounded-lg mt-2 shadow-lg max-h-60 overflow-y-auto">
              {nameSuggestions.map((name) => (
                <li
                  key={name}
                  className="px-4 py-2 cursor-pointer hover:bg-green-100 text-green-900"
                  onClick={() => handleSuggestionClick(name)}
                >
                  {name}
                </li>
              ))}
            </ul>
          )}
          {/* Search hint */}
          <div className="mt-2 text-green-700 text-xs sm:text-sm text-center">
            Start typing a name to search for personnel duties.
          </div>
        </form>

        {/* Results Section */}
        {error && (
          <div className="text-center text-red-600 text-base sm:text-lg font-medium py-4">
            {error}
          </div>
        )}

        {selectedName && (
          <div className="space-y-6">
            <div className="text-center">
              <span className="inline-block px-4 py-2 bg-green-100 text-green-900 rounded-lg font-semibold text-base sm:text-lg shadow">
                {results.length > 0
                  ? `Found ${results.length} dut${results.length === 1 ? 'y' : 'ies'} for "${selectedName}"`
                  : `No duties found for "${selectedName}"`}
              </span>
            </div>
            {results.length > 0 ? (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-green-800 mb-4">
                  Found {results.length} dut{results.length === 1 ? 'y' : 'ies'} for &quot;{selectedName}&quot;
                </h2>
                <div className="space-y-4">
                  {results.map((result, index) => (
                    <div 
                      key={index}
                      className="p-4 border border-green-200 rounded-lg bg-green-50"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-semibold text-green-700">{new Date(2025, 6, result.date).toLocaleDateString("en-US", { month: "long", day: "numeric" })}:</span>
                          <span className="ml-2 text-green-800">
                            {result.shift} Shift ({result.type})
                            {result.isExtra && <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 rounded font-bold">EXTRA DUTY</span>}
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
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-6 text-center text-green-700">
                No duties found for &quot;{selectedName}&quot;
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
} 