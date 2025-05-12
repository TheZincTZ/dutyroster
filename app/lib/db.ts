import { sql } from '@vercel/postgres';

export interface RosterData {
  date: string;
  personnel: string;
  scoreboard: string;
}

export async function storeRosterData(data: RosterData[]) {
  // First, clear existing data
  await sql`DELETE FROM roster_data`;
  
  // Insert new data
  for (const row of data) {
    await sql`
      INSERT INTO roster_data (date, personnel, scoreboard)
      VALUES (${row.date}, ${row.personnel}, ${row.scoreboard})
    `;
  }
}

export async function getRosterData(): Promise<RosterData[]> {
  const { rows } = await sql`
    SELECT date, personnel, scoreboard 
    FROM roster_data 
    ORDER BY date ASC
  `;
  return rows as RosterData[];
}

// Function to initialize the database table
export async function initDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS roster_data (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        personnel TEXT NOT NULL,
        scoreboard TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
} 