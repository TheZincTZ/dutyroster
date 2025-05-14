import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { createClient } from "@supabase/supabase-js";
import { headers } from 'next/headers';

// Rate limiting
const RATE_LIMIT = 10; // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const ipRequests = new Map<string, { count: number; timestamp: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const requestData = ipRequests.get(ip);

  if (!requestData) {
    ipRequests.set(ip, { count: 1, timestamp: now });
    return false;
  }

  if (now - requestData.timestamp > RATE_LIMIT_WINDOW) {
    ipRequests.set(ip, { count: 1, timestamp: now });
    return false;
  }

  if (requestData.count >= RATE_LIMIT) {
    return true;
  }

  requestData.count++;
  return false;
}

// Clean up old rate limit entries
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipRequests.entries()) {
    if (now - data.timestamp > RATE_LIMIT_WINDOW) {
      ipRequests.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW);

export async function POST(req: NextRequest) {
  try {
    // Get client IP
    const headersList = headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';

    // Check rate limit
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate request headers
    const contentType = headersList.get('content-type');
    if (!contentType?.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate X-Requested-With header
    const requestedWith = headersList.get('x-requested-with');
    if (requestedWith !== 'XMLHttpRequest') {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with headers
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: '', // Default value for empty cells
      blankrows: false // Skip empty rows
    });

    // Extract extras personnel from columns F (5) and G (6), rows 29-34 (indices 28-33)
    const extrasPersonnel = [];
    for (let i = 29; i <= 33; i++) {
      const row = jsonData[i] as unknown[];
      if (!row) continue;
      const name = row[5] ? String(row[5]).trim() : '';
      const number = row[6] ? parseInt(row[6] as string, 10) : null;
      if (name) {
        extrasPersonnel.push({ name, number: number || 0 });
      }
    }

    // Extract point system data
    const pointSystems = [];
    // Brigade Morning: J-M, 3-14 (indices 9-12, 2-13)
    for (let i = 2; i <= 13; i++) {
      const row = jsonData[i] as unknown[];
      if (!row) continue;
      const name = row[9] ? String(row[9]).trim() : '';
      const points = row[10] ? Number(row[10]) : 0;
      const months_valid = row[11] ? Number(row[11]) : 0;
      const average_points = row[12] ? Number(row[12]) : 0;
      if (name) {
        pointSystems.push({ unit: 'brigade', shift: 'morning', name, points, months_valid, average_points });
      }
    }
    // Brigade Night: J-M, 17-27 (indices 9-12, 16-26)
    for (let i = 16; i <= 26; i++) {
      const row = jsonData[i] as unknown[];
      if (!row) continue;
      const name = row[9] ? String(row[9]).trim() : '';
      const points = row[10] ? Number(row[10]) : 0;
      const months_valid = row[11] ? Number(row[11]) : 0;
      const average_points = row[12] ? Number(row[12]) : 0;
      if (name) {
        pointSystems.push({ unit: 'brigade', shift: 'night', name, points, months_valid, average_points });
      }
    }
    // SSP Morning: J-M, 30 (index 29)
    {
      const row = jsonData[29] as unknown[];
      if (row) {
        const name = row[9] ? String(row[9]).trim() : '';
        const points = row[10] ? Number(row[10]) : 0;
        const months_valid = row[11] ? Number(row[11]) : 0;
        const average_points = row[12] ? Number(row[12]) : 0;
        if (name) {
          pointSystems.push({ unit: 'ssp', shift: 'morning', name, points, months_valid, average_points });
        }
      }
    }
    // SSP Night: J-M, 32-39 (indices 31-38)
    for (let i = 31; i <= 38; i++) {
      const row = jsonData[i] as unknown[];
      if (!row) continue;
      const name = row[9] ? String(row[9]).trim() : '';
      const points = row[10] ? Number(row[10]) : 0;
      const months_valid = row[11] ? Number(row[11]) : 0;
      const average_points = row[12] ? Number(row[12]) : 0;
      if (name) {
        pointSystems.push({ unit: 'ssp', shift: 'night', name, points, months_valid, average_points });
      }
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Process and validate data before insertion
    const validData = jsonData.filter((row: any) => {
      return (
        typeof row === 'object' &&
        row !== null &&
        'Date' in row &&
        'AM' in row &&
        'PM' in row &&
        'ReserveAM' in row &&
        'ReservePM' in row
      );
    });

    if (validData.length === 0) {
      return NextResponse.json(
        { error: "No valid data found in file" },
        { status: 400 }
      );
    }

    // Begin transaction
    const { error: transactionError } = await supabase.rpc('begin_transaction');
    if (transactionError) throw transactionError;

    try {
      // Clear existing data
      const { error: clearError } = await supabase.from("duty_roster").delete().neq("id", 0);
      if (clearError) throw clearError;

      // Insert new data
      const { error: insertError } = await supabase.from("duty_roster").insert(validData);
      if (insertError) throw insertError;

      // Commit transaction
      const { error: commitError } = await supabase.rpc('commit_transaction');
      if (commitError) throw commitError;

      return NextResponse.json({ 
        message: "File uploaded successfully",
        data: validData,
        extrasPersonnel,
        pointSystems
      });
    } catch (error) {
      // Rollback transaction on error
      await supabase.rpc('rollback_transaction');
      throw error;
    }
  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing the file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 