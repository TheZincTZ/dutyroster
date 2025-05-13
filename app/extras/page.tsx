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
      <div className="max-w-lg mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-green-800">Extras Personnel</h1>
          <Link href="/" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Back to Roster</Link>
        </div>
        {loading ? (
          <div className="text-center text-green-700">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : extras.length === 0 ? (
          <div className="text-center text-green-700">No extras personnel found.</div>
        ) : (
          <table className="min-w-full border border-green-200 rounded-lg">
            <thead>
              <tr className="bg-green-100">
                <th className="px-4 py-2 text-left text-green-700 font-semibold">Name</th>
                <th className="px-4 py-2 text-left text-green-700 font-semibold">Number</th>
              </tr>
            </thead>
            <tbody>
              {extras.map((person) => (
                <tr key={person.id} className="border-t border-green-100">
                  <td className="px-4 py-2 text-green-900 font-medium">{person.name}</td>
                  <td className="px-4 py-2 text-green-800">{person.number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
} 