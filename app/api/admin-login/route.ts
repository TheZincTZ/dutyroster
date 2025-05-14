import { NextResponse } from 'next/server';

export async function POST() {
  // You can add extra validation here if needed
  const response = NextResponse.json({ success: true });
  response.cookies.set('admin_authenticated', 'true', {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60, // 1 hour
    sameSite: 'strict',
    secure: true,
  });
  return response;
} 