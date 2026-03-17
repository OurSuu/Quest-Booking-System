const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const db = new Database(path.join(__dirname, 'bookings.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    time_slot TEXT NOT NULL,
    group_name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

// Valid time slots
const VALID_TIME_SLOTS = ['13:00–19:00', '21:30–01:30'];

// Helper: validate date is at least 3 days in advance
function isAtLeast3DaysAhead(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bookingDate = new Date(dateStr + 'T00:00:00');
  const diffMs = bookingDate - today;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= 3;
}

// Helper: check for duplicate booking
function isDuplicate(date, timeSlot, excludeId = null) {
  let query = 'SELECT id FROM bookings WHERE date = ? AND time_slot = ?';
  const params = [date, timeSlot];
  if (excludeId) {
    query += ' AND id != ?';
    params.push(excludeId);
  }
  const row = db.prepare(query).get(...params);
  return !!row;
}

// GET /bookings - Get all bookings
app.get('/bookings', (req, res) => {
  try {
    const bookings = db.prepare('SELECT * FROM bookings ORDER BY date ASC, time_slot ASC').all();
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// POST /book - Create a new booking
app.post('/book', (req, res) => {
  try {
    const { date, time_slot, group_name } = req.body;

    // Validate required fields
    if (!date || !time_slot || !group_name) {
      return res.status(400).json({ error: 'All fields are required: date, time_slot, group_name' });
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Validate time slot
    if (!VALID_TIME_SLOTS.includes(time_slot)) {
      return res.status(400).json({ error: `Invalid time slot. Must be one of: ${VALID_TIME_SLOTS.join(', ')}` });
    }

    // Validate group name
    if (group_name.trim().length === 0) {
      return res.status(400).json({ error: 'Group name cannot be empty' });
    }

    // Validate 3 days in advance
    if (!isAtLeast3DaysAhead(date)) {
      return res.status(400).json({ error: 'Booking must be at least 3 days in advance' });
    }

    // Check for duplicates
    if (isDuplicate(date, time_slot)) {
      return res.status(409).json({ error: 'A booking already exists for this date and time slot' });
    }

    const stmt = db.prepare('INSERT INTO bookings (date, time_slot, group_name) VALUES (?, ?, ?)');
    const result = stmt.run(date, time_slot, group_name.trim());

    const newBooking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newBooking);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// PUT /book/:id - Update a booking
app.put('/book/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { date, time_slot, group_name } = req.body;

    // Check if booking exists
    const existing = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Validate required fields
    if (!date || !time_slot || !group_name) {
      return res.status(400).json({ error: 'All fields are required: date, time_slot, group_name' });
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Validate time slot
    if (!VALID_TIME_SLOTS.includes(time_slot)) {
      return res.status(400).json({ error: `Invalid time slot. Must be one of: ${VALID_TIME_SLOTS.join(', ')}` });
    }

    // Validate group name
    if (group_name.trim().length === 0) {
      return res.status(400).json({ error: 'Group name cannot be empty' });
    }

    // Validate 3 days in advance
    if (!isAtLeast3DaysAhead(date)) {
      return res.status(400).json({ error: 'Booking must be at least 3 days in advance' });
    }

    // Check for duplicates (excluding current booking)
    if (isDuplicate(date, time_slot, parseInt(id))) {
      return res.status(409).json({ error: 'A booking already exists for this date and time slot' });
    }

    const stmt = db.prepare('UPDATE bookings SET date = ?, time_slot = ?, group_name = ? WHERE id = ?');
    stmt.run(date, time_slot, group_name.trim(), id);

    const updated = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// DELETE /book/:id - Delete a booking
app.delete('/book/:id', (req, res) => {
  try {
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    db.prepare('DELETE FROM bookings WHERE id = ?').run(id);
    res.json({ message: 'Booking deleted successfully', id: parseInt(id) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

app.listen(PORT, () => {
  console.log(`Booking server running at http://localhost:${PORT}`);
});
