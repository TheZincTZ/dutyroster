import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
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

    return NextResponse.json({ data: jsonData, extrasPersonnel, pointSystems });
  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json(
      { error: 'Error processing file' },
      { status: 500 }
    );
  }
} 