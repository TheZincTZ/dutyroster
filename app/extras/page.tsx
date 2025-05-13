"use client";

import { useState, useEffect } from "react";
import { getExtrasData, ExtrasPersonnel } from "../lib/supabase";
import Link from 'next/link';

export default function ExtrasPage() {
  const [extras, setExtras] = useState<ExtrasPersonnel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        const extrasData = await getExtrasData();
        if (isMounted) {
          setExtras(extrasData);
        }
      } catch (err) {
        console.error('Error loading extras data:', err);
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

  if (loading) {
    return (
      <main className="min-h-screen p-8 bg-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto mb-4"></div>
          <p className="text-green-700">Loading extras personnel...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 bg-green-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-green-800">Extras Personnel</h1>
          <Link 
            href="/" 
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Back to Roster
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="space-y-4">
            {extras.map((person) => (
              <div 
                key={person.id}
                className="p-4 border border-green-200 rounded-lg bg-green-50"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-green-700">{person.name}</span>
                  </div>
                  <div className="text-sm text-green-600">
                    Number of Extras: {person.number_of_extras}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
} 