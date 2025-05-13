"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";
import Link from "next/link";

type Duty = {
  date: number;
  shift: string;
  type: string;
};

export default function SearchClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<Duty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const { data: rosterData, error: rosterError } = await supabase
        .from("roster_data")
        .select("*");

      if (rosterError) throw rosterError;

      const duties: Duty[] = [];
      const search = searchTerm.trim().toLowerCase();
      rosterData?.forEach((day) => {
        // Helper to check if the search term matches any name in the cell
        const matches = (cell: string) =>
          cell
            ?.split(',')
            .map((n: string) => n.trim().toLowerCase())
            .includes(search);

        if (matches(day.AM)) {
          duties.push({ date: day.date, shift: "AM", type: "Primary" });
        }
        if (matches(day.PM)) {
          duties.push({ date: day.date, shift: "PM", type: "Primary" });
        }
        if (matches(day.ReserveAM)) {
          duties.push({ date: day.date, shift: "AM", type: "Reserve" });
        }
        if (matches(day.ReservePM)) {
          duties.push({ date: day.date, shift: "PM", type: "Reserve" });
        }
      });

      setResults(duties);
    } catch (err) {
      setError("Failed to search duties");
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
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
        <form onSubmit={handleSearch} className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter personnel name..."
              className="flex-1 px-4 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-base sm:text-lg"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-center"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </form>

        {/* Results Section */}
        {error && (
          <div className="text-center text-red-600 text-base sm:text-lg font-medium py-4">
            {error}
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-6">
            <div className="text-center text-green-700 text-base sm:text-lg">
              Found <span className="font-bold">{results.length}</span> duties for{" "}
              <span className="font-bold text-green-900">{searchTerm}</span>
            </div>

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
          </div>
        )}

        {!loading && !error && searchTerm && results.length === 0 && (
          <div className="text-center text-green-700 text-base sm:text-lg font-medium py-8">
            No duties found for &quot;{searchTerm}&quot;
          </div>
        )}
      </div>
    </main>
  );
} 