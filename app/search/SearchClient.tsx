"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import Link from "next/link";

type Duty = {
  date: number;
  shift: string;
  type: string;
};

interface RosterRow {
  date: number;
  AM: string;
  PM: string;
  ReserveAM: string;
  ReservePM: string;
}

export default function SearchClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [allNames, setAllNames] = useState<string[]>([]);
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [results, setResults] = useState<Duty[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [rosterData, setRosterData] = useState<RosterRow[]>([]);

  // Load all unique personnel names on mount
  useEffect(() => {
    const fetchRoster = async () => {
      setError(null);
      try {
        const { data, error } = await supabase.from("roster_data").select("*");
        if (error) throw error;
        setRosterData(data || []);
        // Extract all unique names from all fields
        const nameSet = new Set<string>();
        data?.forEach((row: RosterRow) => {
          [row.AM, row.PM, row.ReserveAM, row.ReservePM].forEach((cell) => {
            if (cell) {
              cell.split(",").forEach((n: string) => {
                const name = n.trim();
                if (name) nameSet.add(name);
              });
            }
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
    const suggestions = allNames.filter((name) =>
      name.toLowerCase().includes(searchTerm.trim().toLowerCase())
    );
    setNameSuggestions(suggestions);
    setSelectedName(null);
    setResults([]);
  }, [searchTerm, allNames]);

  // When a name is selected, find all duties for that name
  useEffect(() => {
    if (!selectedName) return;
    const duties: Duty[] = [];
    rosterData.forEach((day) => {
      const check = (cell: string) =>
        cell
          ?.split(",")
          .map((n: string) => n.trim())
          .includes(selectedName);
      if (check(day.AM)) {
        duties.push({ date: day.date, shift: "AM", type: "Primary" });
      }
      if (check(day.PM)) {
        duties.push({ date: day.date, shift: "PM", type: "Primary" });
      }
      if (check(day.ReserveAM)) {
        duties.push({ date: day.date, shift: "AM", type: "Reserve" });
      }
      if (check(day.ReservePM)) {
        duties.push({ date: day.date, shift: "PM", type: "Reserve" });
      }
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
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-green-900 tracking-tight flex items-center gap-2">
            <span className="inline-block w-2 h-6 sm:h-8 bg-green-600 rounded-full mr-2"></span>
            Search Personnel
          </h1>
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
              className="flex-1 px-4 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-base sm:text-lg"
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
            {results.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-green-200 rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-green-100">
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-green-700 font-semibold text-base sm:text-lg">Date</th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-green-700 font-semibold text-base sm:text-lg">Shift</th>
                      <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-green-700 font-semibold text-base sm:text-lg">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((duty, idx) => (
                      <tr 
                        key={`${duty.date}-${duty.shift}-${duty.type}`}
                        className={"border-t border-green-100 " + (idx % 2 === 0 ? "bg-green-50" : "bg-white") + " hover:bg-green-200 transition"}
                      >
                        <td className="px-3 sm:px-4 py-2 sm:py-3 text-green-900 font-medium text-base sm:text-lg">
                          {new Date(2024, 0, duty.date).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric"
                          })}
                        </td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3 text-green-800 text-base sm:text-lg">
                          {duty.shift}
                        </td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3 text-green-800 text-base sm:text-lg">
                          {duty.type}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
} 