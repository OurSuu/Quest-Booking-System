import { NextRequest, NextResponse } from 'next/server';
import { getBookingById, updateBooking, deleteBooking, isDuplicate, isAtLeast3DaysAhead, VALID_TIME_SLOTS } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);

    // Check if booking exists
    const existing = getBookingById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

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

    // Validate 3 days in advance
    if (!isAtLeast3DaysAhead(date)) {
      return NextResponse.json({ error: 'Booking must be at least 3 days in advance' }, { status: 400 });
    }

    // Check for duplicates (excluding current booking)
    if (isDuplicate(date, time_slot, id)) {
      return NextResponse.json({ error: 'A booking already exists for this date and time slot' }, { status: 409 });
    }

    const updated = updateBooking(id, date, time_slot, group_name.trim());
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);

    const existing = getBookingById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    deleteBooking(id);
    return NextResponse.json({ message: 'Booking deleted successfully', id });
  } catch {
    return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 });
  }
}
