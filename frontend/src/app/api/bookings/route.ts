import { NextResponse } from 'next/server';
import { getAllBookings } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const bookings = await getAllBookings();
    return NextResponse.json(bookings);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}
