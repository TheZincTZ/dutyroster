"use client";

import { useState, useEffect } from "react";
import { storeRosterData, getRosterData, CalendarMap } from "../lib/supabase";
import * as XLSX from 'xlsx';

const DATE_ROW_INDEXES = [1, 6, 11, 16, 21]; // 0-based: rows 2,7,12,17,22
const AM_COLUMN_INDEX = 1; // 0-based: column B
const PM_COLUMN_INDEX = 2; // 0-based: column C
const RESERVE_AM_COLUMN_INDEX = 3; // 0-based: column D
const RESERVE_PM_COLUMN_INDEX = 4; // 0-based: column E

export default function AdminUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [calendar, setCalendar] = useState<CalendarMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load existing data
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getRosterData();
        setCalendar(data);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load existing data');
      }
    };
    loadData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      if (!worksheet) {
        throw new Error('No worksheet found in the Excel file');
      }

      const newCalendar: CalendarMap = { ...calendar };
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1; // 1-12

      DATE_ROW_INDEXES.forEach((rowIndex) => {
        const dateCell = worksheet[`A${rowIndex + 1}`];
        if (!dateCell || !dateCell.v) return;

        const date = parseInt(dateCell.v.toString());
        if (isNaN(date)) return;

        const dateKey = `${currentYear}-${currentMonth}-${date}`;
        newCalendar[dateKey] = {
          AM: worksheet[`B${rowIndex + 1}`]?.v?.toString() || "",
          PM: worksheet[`C${rowIndex + 1}`]?.v?.toString() || "",
          ReserveAM: worksheet[`D${rowIndex + 1}`]?.v?.toString() || "",
          ReservePM: worksheet[`E${rowIndex + 1}`]?.v?.toString() || "",
        };
      });

      await storeRosterData(newCalendar);
      setCalendar(newCalendar);
      setSuccess(true);
    } catch (err) {
      console.error('Error processing file:', err);
      setError('Failed to process the file. Please make sure it\'s a valid Excel file with the correct format.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-green-50">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-green-800">Admin Upload</h1>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-green-700 mb-2">
            Upload Excel File
          </label>
          <input
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            className="block w-full text-sm text-green-700
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-green-50 file:text-green-700
              hover:file:bg-green-100"
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className={`w-full py-2 px-4 rounded-md text-white font-medium
            ${!file || loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
            }`}
        >
          {loading ? 'Uploading...' : 'Upload'}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-md">
            File uploaded successfully!
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-green-800 mb-4">Current Roster Data</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-green-200">
              <thead className="bg-green-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">AM</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">PM</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Reserve AM</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">Reserve PM</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-green-200">
                {Object.entries(calendar).map(([date, entry]) => (
                  <tr key={date}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-900">{date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-900">{entry.AM}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-900">{entry.PM}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{entry.ReserveAM}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{entry.ReservePM}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
} 