# Duty Roster Management System

A modern web application for viewing duty rosters for National Service personnel, built with Next.js and Supabase.

## Overview

This application provides a user-friendly interface for NS personnel to view their duties, extras personnel information, and point systems. It offers real-time access to duty schedules and personnel information through a secure, responsive interface.

## Features

- **Roster Viewing**
  - View monthly schedules
  - Track today's and tomorrow's duties
  - Search personnel duties
  - Responsive design for all devices

- **Extras Personnel**
  - View extras personnel information
  - Track personnel availability
  - Access personnel details

- **Point System**
  - View duty points
  - Check point allocations
  - Monitor duty distribution

## Project Structure

The application follows a modern Next.js 14 architecture:

```
app/
├── extras/         # Extras personnel view
├── monthlyschedule/ # Monthly schedule view
├── search/         # Personnel search
├── todaytomorrow/  # Today/Tomorrow duties
├── lib/           # Shared utilities and database access
└── components/    # Reusable UI components
```

## Data Flow

1. **Data Access**
   - Secure access to roster data
   - Real-time data updates
   - Optimized performance

2. **View Generation**
   - Data is processed and formatted for display
   - Responsive UI adapts to different screen sizes
   - Interactive features for better user experience

## Technical Stack

- **Frontend**
  - Next.js 14 (App Router)
  - TypeScript
  - Tailwind CSS
  - Geist Font

- **Backend**
  - Supabase
  - PostgreSQL

## Getting Started

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create a .env.local file with the following variables:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_DUTY_ROSTER_PIN=your_pin_here
```

4. Run the development server:
```bash
npm run dev
```

## Deployment

The application is deployed on Vercel:

1. Automatic deployments from main branch
2. Environment variables configured in Vercel
3. Supabase database connection

## Environment Variables

The application uses the following environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `NEXT_PUBLIC_DUTY_ROSTER_PIN`: The PIN code for accessing the duty roster (default: 746281T3!)

### Setting up Environment Variables

1. **Local Development**: Create a `.env.local` file in the root directory
2. **Vercel Deployment**: Add these variables in your Vercel project settings

## Security Features

- Secure data access
- Protected routes
- Encrypted data transmission
- PIN-based authentication

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

MIT License
