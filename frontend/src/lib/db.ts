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

const globalForDb = globalThis as unknown as {
  _bookings?: BookingRecord[];
  _nextId?: number;
};

const bookings: BookingRecord[] = globalForDb._bookings || [];
let nextId = globalForDb._nextId || 1;

if (process.env.NODE_ENV !== 'production') {
  globalForDb._bookings = bookings;
  globalForDb._nextId = nextId;
}

export const VALID_TIME_SLOTS = ['13:00–19:00', '21:30–01:30'];
export const MAX_SLOT_CAPACITY = 1;

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

export function getSlotCount(date: string, timeSlot: string, excludeId?: number): number {
  return bookings.filter(b => b.date === date && b.time_slot === timeSlot && b.id !== excludeId).length;
}

export function isSlotFull(date: string, timeSlot: string, excludeId?: number): boolean {
  return getSlotCount(date, timeSlot, excludeId) >= MAX_SLOT_CAPACITY;
}

export function isFutureDate(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bookingDate = new Date(dateStr + 'T00:00:00');
  return bookingDate.getTime() > today.getTime(); // strictly after today
}
