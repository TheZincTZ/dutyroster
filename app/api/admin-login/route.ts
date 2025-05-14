import { NextResponse } from 'next/server';

export async function POST() {
  // You can add extra validation here if needed
  const response = NextResponse.json({ success: true });
  response.cookies.set('admin_authenticated', 'true', {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60, // 1 hour
    sameSite: 'lax', // more compatible for dev
    secure: process.env.NODE_ENV === 'production', // only secure in production
  });
  return response;
} 