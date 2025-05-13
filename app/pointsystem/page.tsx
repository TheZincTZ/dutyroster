"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
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

export default function PointSystemPage() {
  const [points, setPoints] = useState<PointSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPoints = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("point_systems")
        .select("id, unit, shift, name, points, months_valid, average_points")
        .order("unit")
        .order("shift")
        .order("name");
      if (error) {
        setError("Failed to load point system data");
      } else {
        setPoints(data || []);
      }
      setLoading(false);
    };
    fetchPoints();
  }, []);

  const renderTable = (unit: string, shift: string) => {
    const filtered = points.filter(p => p.unit === unit && p.shift === shift);
    if (filtered.length === 0) return (
      <div className="text-green-700 text-center py-4">No data for {unit} {shift}.</div>
    );
    return (
      <table className="min-w-full border border-green-200 rounded-xl overflow-hidden mb-6">
        <thead>
          <tr className="bg-green-100">
            <th className="px-4 py-3 text-left text-green-700 font-semibold text-lg">Name</th>
            <th className="px-4 py-3 text-left text-green-700 font-semibold text-lg">Points</th>
            <th className="px-4 py-3 text-left text-green-700 font-semibold text-lg">Months Valid</th>
            <th className="px-4 py-3 text-left text-green-700 font-semibold text-lg">Average Points</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((p, idx) => (
            <tr key={p.id} className={"border-t border-green-100 " + (idx % 2 === 0 ? "bg-green-50" : "bg-white") + " hover:bg-green-200 transition"}>
              <td className="px-4 py-3 text-green-900 font-medium text-lg">{p.name}</td>
              <td className="px-4 py-3 text-green-800 text-lg">{p.points}</td>
              <td className="px-4 py-3 text-green-800 text-lg">{p.months_valid}</td>
              <td className="px-4 py-3 text-green-800 text-lg">{p.average_points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <main className="min-h-screen p-8 bg-green-50">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-10 border border-green-100">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-4xl font-extrabold text-green-900 tracking-tight flex items-center gap-2">
            <span className="inline-block w-2 h-8 bg-green-600 rounded-full mr-2"></span>
            Point System
          </h1>
          <Link href="/" className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors font-semibold">Back to Roster</Link>
        </div>
        {loading ? (
          <div className="text-center text-green-700 text-lg font-medium flex flex-col items-center gap-2">
            <span className="text-3xl animate-spin">🌀</span>
            Loading...
          </div>
        ) : error ? (
          <div className="text-center text-red-600 text-lg font-medium">{error}</div>
        ) : (
          <div className="space-y-10">
            <section>
              <h2 className="text-2xl font-bold text-green-800 mb-4 flex items-center gap-2">
                <span className="inline-block w-2 h-6 bg-green-700 rounded-full mr-2"></span>
                Brigade
              </h2>
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-green-700 mb-2">Morning</h3>
                {renderTable("brigade", "morning")}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-green-700 mb-2">Night</h3>
                {renderTable("brigade", "night")}
              </div>
            </section>
            <section>
              <h2 className="text-2xl font-bold text-green-800 mb-4 flex items-center gap-2">
                <span className="inline-block w-2 h-6 bg-green-900 rounded-full mr-2"></span>
                SSP
              </h2>
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-green-700 mb-2">Morning</h3>
                {renderTable("ssp", "morning")}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-green-700 mb-2">Night</h3>
                {renderTable("ssp", "night")}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
} 