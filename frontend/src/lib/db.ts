// In-memory booking store for serverless deployment
// Note: In production, replace with a real database (Supabase, PlanetScale, etc.)
// Data resets on each cold start in serverless environments

export interface BookingRecord {
  id: number;
  date: string;
  time_slot: string;
  group_name: string;
  created_at: string;
}

let nextId = 1;
const bookings: BookingRecord[] = [];

export const VALID_TIME_SLOTS = ['13:00–19:00', '21:30–01:30'];

export function getAllBookings(): BookingRecord[] {
  return [...bookings].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.time_slot.localeCompare(b.time_slot);
  });
}

export function getBookingById(id: number): BookingRecord | undefined {
  return bookings.find(b => b.id === id);
}

export function createBooking(date: string, time_slot: string, group_name: string): BookingRecord {
  const booking: BookingRecord = {
    id: nextId++,
    date,
    time_slot,
    group_name,
    created_at: new Date().toISOString(),
  };
  bookings.push(booking);
  return booking;
}

export function updateBooking(id: number, date: string, time_slot: string, group_name: string): BookingRecord | null {
  const idx = bookings.findIndex(b => b.id === id);
  if (idx === -1) return null;
  bookings[idx] = { ...bookings[idx], date, time_slot, group_name };
  return bookings[idx];
}

export function deleteBooking(id: number): boolean {
  const idx = bookings.findIndex(b => b.id === id);
  if (idx === -1) return false;
  bookings.splice(idx, 1);
  return true;
}

export function isDuplicate(date: string, timeSlot: string, excludeId?: number): boolean {
  return bookings.some(b => b.date === date && b.time_slot === timeSlot && b.id !== excludeId);
}

export function isAtLeast3DaysAhead(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bookingDate = new Date(dateStr + 'T00:00:00');
  const diffMs = bookingDate.getTime() - today.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= 3;
}
