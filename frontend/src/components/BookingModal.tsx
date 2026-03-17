'use client';

import { useState, useEffect, useMemo } from 'react';
import { Booking, TIME_SLOTS, MAX_SLOT_CAPACITY } from '@/types';
import { useToast } from './Toast';
import styles from './BookingModal.module.css';

interface Props {
  editingBooking: Booking | null;
  selectedDate: string | null;
  bookings: Booking[];
  onClose: () => void;
  onSuccess: (action: 'created' | 'updated') => void;
}

export default function BookingModal({ editingBooking, selectedDate, bookings, onClose, onSuccess }: Props) {
  const { showToast } = useToast();
  const [groupName, setGroupName] = useState('');
  const [timeSlot, setTimeSlot] = useState<string>(TIME_SLOTS[0]);
  const [date, setDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isEditMode = !!editingBooking;

  useEffect(() => {
    if (editingBooking) {
      setGroupName(editingBooking.group_name);
      setTimeSlot(editingBooking.time_slot);
      setDate(editingBooking.date);
    } else if (selectedDate) {
      setDate(selectedDate);
    }
  }, [editingBooking, selectedDate]);

  const isDatePast = useMemo(() => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(date + 'T00:00:00') < today;
  }, [date]);

  const isToday = useMemo(() => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(date + 'T00:00:00').getTime() === today.getTime();
  }, [date]);

  const isDateInvalid = isDatePast || isToday;

  // Get slot count for selected date+slot
  const slotCount = useMemo(() => {
    if (!date || !timeSlot) return 0;
    return bookings.filter(
      b => b.date === date && b.time_slot === timeSlot && (!editingBooking || b.id !== editingBooking.id)
    ).length;
  }, [date, timeSlot, bookings, editingBooking]);

  const isSlotFull = slotCount >= MAX_SLOT_CAPACITY;

  // Get counts per slot for the selected date
  const slotCounts = useMemo(() => {
    if (!date) return {};
    const counts: Record<string, number> = {};
    TIME_SLOTS.forEach(slot => {
      counts[slot] = bookings.filter(
        b => b.date === date && b.time_slot === slot && (!editingBooking || b.id !== editingBooking.id)
      ).length;
    });
    return counts;
  }, [date, bookings, editingBooking]);

  const isSubmitDisabled = loading || isDateInvalid || isSlotFull || !groupName.trim();

  const warningMessage = useMemo(() => {
    if (isDatePast) return 'You cannot book past or current day.';
    if (isToday) return 'You cannot book past or current day.';
    if (isSlotFull) return 'This time slot is already taken.';
    return null;
  }, [isDatePast, isToday, isSlotFull]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!groupName.trim()) { setError('Your party needs a name, adventurer!'); return; }
    if (!date) { setError('Choose a date for your quest!'); return; }
    if (isDateInvalid) { setError('You cannot book past or current day.'); return; }
    if (isSlotFull) { setError('This time slot is already taken.'); return; }

    setLoading(true);

    try {
      const url = isEditMode
        ? `/api/book/${editingBooking.id}`
        : `/api/book`;

      const res = await fetch(url, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          time_slot: timeSlot,
          group_name: groupName.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'The spell fizzled!');
        showToast(data.error || 'The spell fizzled!', 'error');
        setLoading(false);
        return;
      }

      onSuccess(isEditMode ? 'updated' : 'created');
    } catch {
      setError('Cannot reach the guild server!');
      showToast('Cannot reach the guild server!', 'error');
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>{isEditMode ? '⚔ Rewrite Fate' : '📜 Quest Reservation'}</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close scroll">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="booking-date">Quest Date</label>
            <input
              id="booking-date"
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setError(null); }}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="booking-timeslot">Time of Battle</label>
            <select
              id="booking-timeslot"
              value={timeSlot}
              onChange={(e) => { setTimeSlot(e.target.value); setError(null); }}
            >
              {TIME_SLOTS.map(slot => {
                const count = slotCounts[slot] ?? 0;
                const taken = count >= MAX_SLOT_CAPACITY;
                return (
                  <option key={slot} value={slot} disabled={taken}>
                    {slot}{slot === '21:30–01:30' ? ' (nightfall)' : ''} — {taken ? '⛔ Taken' : 'Available'}
                  </option>
                );
              })}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="booking-group">Party Name</label>
            <input
              id="booking-group"
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter your party name..."
              required
            />
          </div>

          {/* Capacity indicator */}
          {date && !isDateInvalid && (
            <div className={isSlotFull ? styles.capacityFull : styles.capacityOk}>
              ⚗ Slot status: {isSlotFull ? '⛔ This time slot is taken!' : '✅ Slot is available'}
            </div>
          )}

          {warningMessage && <div className={styles.warning}>⚠ {warningMessage}</div>}
          {error && !warningMessage && <div className={styles.error}>✕ {error}</div>}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Retreat
            </button>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitDisabled}>
              {loading ? 'Casting...' : isEditMode ? 'Rewrite Fate' : 'Register Quest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
