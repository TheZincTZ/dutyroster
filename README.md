# Duty Roster Viewer

A Next.js application that allows you to upload and view Google Sheets data containing duty roster information.

## Features

- Upload Excel/CSV files
- Display duty roster data in a responsive table format
- Support for all data fields from the spreadsheet
- Modern UI with loading states and error handling

## Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory and add your Google Sheets API credentials:
```
GOOGLE_APPLICATION_CREDENTIALS=credentials.json
```

4. Create a project in the Google Cloud Console and enable the Google Sheets API
5. Download the credentials JSON file and save it as `credentials.json` in the root directory

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

1. Prepare your Google Sheets file with the duty roster data
2. Export the sheet as an Excel (.xlsx) or CSV file
3. Visit the application in your browser
4. Click the upload button and select your file
5. The data will be displayed in a table format

## File Format Requirements

The spreadsheet should have:
- Headers in the first row
- Data starting from the second row
- Dates in May
- Duty roster information
- Scoreboard data

## Deployment

The application is ready to be deployed on Vercel:

1. Push your code to a Git repository
2. Connect your repository to Vercel
3. Deploy

## Technologies Used

- Next.js 14
- TypeScript
- Tailwind CSS
- Google Sheets API
- XLSX library for file processing
