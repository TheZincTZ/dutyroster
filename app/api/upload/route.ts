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

    // Extract extras personnel from columns F (5) and G (6), rows 28-34 (indices 27-33)
    const extrasPersonnel = [];
    for (let i = 27; i <= 33; i++) {
      const row = jsonData[i];
      if (!row) continue;
      const name = row[5] ? String(row[5]).trim() : '';
      const number = row[6] ? parseInt(row[6], 10) : null;
      if (name) {
        extrasPersonnel.push({ name, number: number || 0 });
      }
    }

    return NextResponse.json({ data: jsonData, extrasPersonnel });
  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json(
      { error: 'Error processing file' },
      { status: 500 }
    );
  }
} 