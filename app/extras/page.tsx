"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Link from "next/link";

type ExtrasPersonnel = {
  id: number;
  name: string;
  number: number;
};

export default function ExtrasPage() {
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
    <main className="min-h-screen p-8 bg-green-50">
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-2xl p-10 border border-green-100">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-extrabold text-green-900 tracking-tight flex items-center gap-2">
            <span className="inline-block w-2 h-8 bg-green-600 rounded-full mr-2"></span>
            Extras Personnel
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
        ) : extras.length === 0 ? (
          <div className="text-center text-green-700 text-lg font-medium flex flex-col items-center gap-2">
            <span className="text-2xl">👤</span>
            No extras personnel found.
          </div>
        ) : (
          <table className="min-w-full border border-green-200 rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-green-100">
                <th className="px-4 py-3 text-left text-green-700 font-semibold text-lg">Name</th>
                <th className="px-4 py-3 text-left text-green-700 font-semibold text-lg">Number</th>
              </tr>
            </thead>
            <tbody>
              {extras.map((person, idx) => (
                <tr key={person.id} className={"border-t border-green-100 " + (idx % 2 === 0 ? "bg-green-50" : "bg-white") + " hover:bg-green-200 transition"}>
                  <td className="px-4 py-3 text-green-900 font-medium text-lg">{person.name}</td>
                  <td className="px-4 py-3 text-green-800 text-lg">{person.number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
} 