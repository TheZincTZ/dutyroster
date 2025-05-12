import { google } from 'googleapis';
import { authenticate } from '@google-cloud/local-auth';
import path from 'path';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

export async function getAuthClient() {
  const auth = await authenticate({
    keyfilePath: path.join(process.cwd(), 'credentials.json'),
    scopes: SCOPES,
  });

  return auth;
}

export async function getSheetData(spreadsheetId: string, range: string) {
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });
  
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    
    return response.data.values;
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw error;
  }
} 