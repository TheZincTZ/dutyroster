"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/db-access";
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

  useEffect(() => {
    const fetchExtras = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("extras_personnel")
        .select("id, name, number")
        .order("name");
      if (error) {
        setError("Failed to load extras personnel");
      } else {
        setExtras(data || []);
      }
      setLoading(false);
    };
    fetchExtras();
  }, []);

  return (
    <main className="min-h-screen p-4 sm:p-6 md:p-8 bg-green-50">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-4 sm:p-6 md:p-10 border border-green-100">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-green-900 tracking-tight flex items-center gap-2">
            <span className="inline-block w-2 h-6 sm:h-8 bg-green-600 rounded-full mr-2"></span>
            Extras Personnel
          </h1>
          <Link 
            href="/" 
            className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors font-semibold text-center"
          >
            Back to Roster
          </Link>
        </div>

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