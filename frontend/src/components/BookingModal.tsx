'use client';

import { useState, useEffect, useMemo } from 'react';
import { Booking, TIME_SLOTS, API_BASE } from '@/types';
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

  const isLessThan3Days = useMemo(() => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = (new Date(date + 'T00:00:00').getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diff < 3;
  }, [date]);

  const isSlotTaken = useMemo(() => {
    if (!date || !timeSlot) return false;
    return bookings.some(
      b => b.date === date && b.time_slot === timeSlot && (!editingBooking || b.id !== editingBooking.id)
    );
  }, [date, timeSlot, bookings, editingBooking]);

  const isSubmitDisabled = loading || isDatePast || isLessThan3Days || isSlotTaken || !groupName.trim();

  const warningMessage = useMemo(() => {
    if (isDatePast) return 'This date has already passed. The sands of time cannot be reversed.';
    if (isLessThan3Days) return 'The guild requires at least 3 days notice to prepare for a quest.';
    if (isSlotTaken) return 'Another party has already claimed this time slot!';
    return null;
  }, [isDatePast, isLessThan3Days, isSlotTaken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!groupName.trim()) { setError('Your party needs a name, adventurer!'); return; }
    if (!date) { setError('Choose a date for your quest!'); return; }
    if (isDatePast) { setError('The past is sealed. Choose another day.'); return; }
    if (isLessThan3Days) { setError('The guild requires 3 days to prepare.'); return; }

    setLoading(true);

    try {
      const url = isEditMode
        ? `${API_BASE}/book/${editingBooking.id}`
        : `${API_BASE}/book`;

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
              {TIME_SLOTS.map(slot => (
                <option key={slot} value={slot}>
                  {slot}{slot === '21:30–01:30' ? ' (nightfall)' : ''}
                </option>
              ))}
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
