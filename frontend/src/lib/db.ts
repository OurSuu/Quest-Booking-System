import { Pool } from 'pg';

export interface BookingRecord {
  id: number;
  date: string;
  time_slot: string;
  group_name: string;
  created_at: string;
}

export const VALID_TIME_SLOTS = ['13:00–19:00', '21:30–01:30'];
export const MAX_SLOT_CAPACITY = 1;

const globalForDb = globalThis as unknown as {
  _pgPool?: Pool;
};

const pool = globalForDb._pgPool || new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

if (process.env.NODE_ENV !== 'production') {
  globalForDb._pgPool = pool;
}

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      date VARCHAR(10) NOT NULL,
      time_slot VARCHAR(20) NOT NULL,
      group_name VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// Call initDb asynchronously to ensure table exists
initDb().catch(console.error);

function formatRow(row: any): BookingRecord {
  if (!row) return row;
  const formatted = { ...row };
  if (formatted.date instanceof Date) {
    // pg creates a Date at local midnight for DATE types. Extract local YYYY-MM-DD
    const d = formatted.date;
    formatted.date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  // If timestamps are returned, keep them as ISO string or whatever is fine
  return formatted;
}

export async function getAllBookings(): Promise<BookingRecord[]> {
  const res = await pool.query('SELECT * FROM bookings ORDER BY date ASC, time_slot ASC');
  return res.rows.map(formatRow);
}

export async function getBookingById(id: number): Promise<BookingRecord | undefined> {
  const res = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);
  return res.rows[0] ? formatRow(res.rows[0]) : undefined;
}

export async function createBooking(date: string, time_slot: string, group_name: string): Promise<BookingRecord> {
  const res = await pool.query(
    'INSERT INTO bookings (date, time_slot, group_name) VALUES ($1, $2, $3) RETURNING *',
    [date, time_slot, group_name]
  );
  return formatRow(res.rows[0]);
}

export async function updateBooking(id: number, date: string, time_slot: string, group_name: string): Promise<BookingRecord | null> {
  const res = await pool.query(
    'UPDATE bookings SET date = $1, time_slot = $2, group_name = $3 WHERE id = $4 RETURNING *',
    [date, time_slot, group_name, id]
  );
  return res.rows[0] ? formatRow(res.rows[0]) : null;
}

export async function deleteBooking(id: number): Promise<boolean> {
  const res = await pool.query('DELETE FROM bookings WHERE id = $1 RETURNING id', [id]);
  return (res.rowCount ?? 0) > 0;
}

export async function getSlotCount(date: string, timeSlot: string, excludeId?: number): Promise<number> {
  let query = 'SELECT COUNT(*) FROM bookings WHERE date = $1 AND time_slot = $2';
  const params: any[] = [date, timeSlot];
  
  if (excludeId) {
    query += ' AND id != $3';
    params.push(excludeId);
  }
  
  const res = await pool.query(query, params);
  return parseInt(res.rows[0].count, 10);
}

export async function isSlotFull(date: string, timeSlot: string, excludeId?: number): Promise<boolean> {
  const count = await getSlotCount(date, timeSlot, excludeId);
  return count >= MAX_SLOT_CAPACITY;
}

export function isFutureDate(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bookingDate = new Date(dateStr + 'T00:00:00');
  return bookingDate.getTime() > today.getTime();
}
