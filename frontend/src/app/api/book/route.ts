import { NextRequest, NextResponse } from 'next/server';
import { createBooking, isSlotFull, isFutureDate, VALID_TIME_SLOTS } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, time_slot, group_name } = body;

    // Validate required fields
    if (!date || !time_slot || !group_name) {
      return NextResponse.json({ error: 'All fields are required: date, time_slot, group_name' }, { status: 400 });
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 });
    }

    // Validate time slot
    if (!VALID_TIME_SLOTS.includes(time_slot)) {
      return NextResponse.json({ error: `Invalid time slot. Must be one of: ${VALID_TIME_SLOTS.join(', ')}` }, { status: 400 });
    }

    // Validate group name
    if (group_name.trim().length === 0) {
      return NextResponse.json({ error: 'Group name cannot be empty' }, { status: 400 });
    }

    // Validate future date (must be tomorrow or later)
    if (!isFutureDate(date)) {
      return NextResponse.json({ error: 'You cannot book past or current day.' }, { status: 400 });
    }

    // Check slot capacity
    if (await isSlotFull(date, time_slot)) {
      return NextResponse.json({ error: 'This time slot is already taken.' }, { status: 409 });
    }

    const newBooking = await createBooking(date, time_slot, group_name.trim());
    return NextResponse.json(newBooking, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
