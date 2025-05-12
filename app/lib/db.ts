import { sql } from '@vercel/postgres';

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set. Please set up your Vercel Postgres database.');
}

export interface RosterData {
  date: string;
  personnel: string;
  scoreboard: string;
}

export async function storeRosterData(data: RosterData[]) {
  try {
    // First, clear existing data
    await sql`DELETE FROM roster_data`;
    
    // Insert new data
    for (const row of data) {
      await sql`
        INSERT INTO roster_data (date, personnel, scoreboard)
        VALUES (${row.date}, ${row.personnel}, ${row.scoreboard})
      `;
    }
  } catch (error) {
    console.error('Error storing roster data:', error);
    throw new Error('Failed to store roster data in database');
  }
}

export async function getRosterData(): Promise<RosterData[]> {
  try {
    const { rows } = await sql`
      SELECT date, personnel, scoreboard 
      FROM roster_data 
      ORDER BY date ASC
    `;
    return rows as RosterData[];
  } catch (error) {
    console.error('Error getting roster data:', error);
    throw new Error('Failed to retrieve roster data from database');
  }
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
    throw new Error('Failed to initialize database');
  }
} 