'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Booking } from '@/types';
import { useToast } from './Toast';
import BookingModal from './BookingModal';
import ConfirmModal from './ConfirmModal';
import DayDetailModal from './DayDetailModal';
import styles from './Calendar.module.css';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const FANTASY_MESSAGES = [
  'The guild awaits your decision...',
  'Choose your quest wisely...',
  'The ancient calendar reveals all paths...',
  'Fortune favors the bold adventurer...',
  'Fate is written in the stars tonight...',
  'The dungeon master watches patiently...',
  'A quest awaits those who dare...',
  'Roll for initiative, brave soul...',
  'The scroll of destiny unfurls before you...',
  'May the dice be ever in your favor...',
];

function getTodayStr() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

function isBookable(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00');
  const diffDays = (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 3;
}

function isPastOrToday(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00');
  return d <= today;
}

function isUnbookableFuture(dateStr: string): boolean {
  // Future but < 3 days ahead (not today, not past)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00');
  const diffDays = (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > 0 && diffDays < 3;
}

export default function Calendar() {
  const today = new Date();
  const { showToast } = useToast();
  const bgRef = useRef<HTMLDivElement>(null);

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slideDir, setSlideDir] = useState<'left' | 'right' | ''>('');
  const [loading, setLoading] = useState(true);
  const [fantasyMsg, setFantasyMsg] = useState('');

  // Delete confirmation
  const [deletingBooking, setDeletingBooking] = useState<Booking | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Day detail modal
  const [dayDetailDate, setDayDetailDate] = useState<string | null>(null);

  // Random fantasy message
  useEffect(() => {
    setFantasyMsg(FANTASY_MESSAGES[Math.floor(Math.random() * FANTASY_MESSAGES.length)]);
  }, [currentMonth, currentYear]);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch('/api/bookings');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setBookings(data);
    } catch {
      setError('The crystal ball has shattered. Cannot reach the guild server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchBookings(), 1500);
    return () => clearTimeout(t);
  }, [fetchBookings]);

  // Parallax mouse effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!bgRef.current) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      bgRef.current.style.transform = `translate(${-x}px, ${-y}px) scale(1.05)`;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const goToPrevMonth = () => {
    setSlideDir('right');
    setTimeout(() => {
      if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
      else setCurrentMonth(m => m - 1);
      setSlideDir('');
    }, 50);
  };

  const goToNextMonth = () => {
    setSlideDir('left');
    setTimeout(() => {
      if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
      else setCurrentMonth(m => m + 1);
      setSlideDir('');
    }, 50);
  };

  const goToCurrentMonth = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSlideDir('');
  };

  // Build calendar grid
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const calendarCells: { day: number; inMonth: boolean; dateStr: string }[] = [];

  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const pm = currentMonth === 0 ? 11 : currentMonth - 1;
    const py = currentMonth === 0 ? currentYear - 1 : currentYear;
    calendarCells.push({ day: d, inMonth: false, dateStr: `${py}-${String(pm + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push({ day: d, inMonth: true, dateStr: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` });
  }

  const remaining = 42 - calendarCells.length;
  for (let d = 1; d <= remaining; d++) {
    const nm = currentMonth === 11 ? 0 : currentMonth + 1;
    const ny = currentMonth === 11 ? currentYear + 1 : currentYear;
    calendarCells.push({ day: d, inMonth: false, dateStr: `${ny}-${String(nm + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` });
  }

  const getBookingsForDate = (dateStr: string): Booking[] =>
    bookings.filter(b => b.date === dateStr);

  // Click a day → only open detail modal for bookable dates
  const handleDayClick = (dateStr: string) => {
    if (!isBookable(dateStr)) return; // Today, past, and < 3 days: do nothing
    setDayDetailDate(dateStr);
  };

  // From day-detail: open booking form
  const handleNewBookingFromDetail = () => {
    if (!dayDetailDate) return;
    setDayDetailDate(null);
    setSelectedDate(dayDetailDate);
    setEditingBooking(null);
    setShowModal(true);
  };

  // From day-detail: edit
  const handleEditFromDetail = (booking: Booking) => {
    setDayDetailDate(null);
    setEditingBooking(booking);
    setSelectedDate(booking.date);
    setShowModal(true);
  };

  // From day-detail: delete
  const handleDeleteFromDetail = (booking: Booking) => {
    setDayDetailDate(null);
    setDeletingBooking(booking);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingBooking) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/book/${deletingBooking.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || 'The spell failed!', 'error');
      } else {
        showToast('Quest cancelled. The scroll burns to ash.', 'success');
        fetchBookings();
      }
    } catch {
      showToast('The guild server is unreachable!', 'error');
    }
    setDeleteLoading(false);
    setDeletingBooking(null);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingBooking(null);
    setSelectedDate(null);
  };

  const handleBookingSuccess = (action: 'created' | 'updated') => {
    handleModalClose();
    fetchBookings();
    showToast(
      action === 'created'
        ? 'Quest registered! The guild has been notified.'
        : 'Fate rewritten! The scroll has been updated.',
      'success'
    );
  };

  const todayStr = getTodayStr();

  // Loading screen
  if (loading) {
    return (
      <div className={styles.pageWrapper}>
        <div ref={bgRef} className={styles.bgImage} />
        <div className={styles.bgOverlay} />
        <div className={styles.bgShine} />
        <div className={styles.calendarContainer}>
          <div className={styles.loadingScreen}>
            <div className={styles.magicCircle} />
            <div className={styles.loadingText}>Casting spell...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      {/* Background layers */}
      <div ref={bgRef} className={styles.bgImage} />
      <div className={styles.bgOverlay} />
      <div className={styles.bgShine} />

      <div className={styles.calendarContainer}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>
              {MONTH_NAMES[currentMonth]}<span className={styles.year}>{currentYear}</span>
            </h1>
          </div>
          <div className={styles.headerRight}>
            <button className={styles.navBtn} onClick={goToPrevMonth} aria-label="Previous month">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button className={styles.todayBtn} onClick={goToCurrentMonth}>Today</button>
            <button className={styles.navBtn} onClick={goToNextMonth} aria-label="Next month">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        </div>

        {/* Random fantasy message */}
        {fantasyMsg && <div className={styles.fantasyMessage}>「{fantasyMsg}」</div>}

        {error && (
          <div className={styles.errorBanner}>
            {error}
            <button onClick={() => { setError(null); fetchBookings(); }}>Retry Spell</button>
          </div>
        )}

        {/* Day-of-week headers */}
        <div className={styles.weekHeader}>
          {DAYS_OF_WEEK.map(day => (
            <div key={day} className={styles.weekDay}>{day}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className={`${styles.grid} ${slideDir === 'left' ? styles.slideLeft : slideDir === 'right' ? styles.slideRight : ''}`}>
          {calendarCells.map((cell, idx) => {
            const dayBookings = getBookingsForDate(cell.dateStr);
            const isToday = cell.dateStr === todayStr;
            const past = isPastOrToday(cell.dateStr) && !isToday;
            const todayCell = isToday;
            const unbookable = isUnbookableFuture(cell.dateStr);
            const bookable = isBookable(cell.dateStr);

            // Determine CSS classes
            let cellClass = styles.dayCell;
            if (!cell.inMonth) cellClass += ` ${styles.otherMonth}`;
            if (todayCell) cellClass += ` ${styles.todayCell}`;
            if (past) cellClass += ` ${styles.pastDay}`;
            if (unbookable) cellClass += ` ${styles.unbookableDay}`;
            if (bookable && cell.inMonth) cellClass += ` ${styles.availableDay}`;

            return (
              <div
                key={idx}
                className={cellClass}
                onClick={() => handleDayClick(cell.dateStr)}
              >
                <div className={styles.dayNumber}>
                  <span className={isToday ? styles.todayBadge : ''}>{cell.day}</span>
                </div>
                <div className={styles.bookingsList}>
                  {dayBookings.map(booking => (
                    <div key={booking.id} className={styles.bookingCard}>
                      <div className={styles.bookingInfo}>
                        <span className={styles.bookingTime}>{booking.time_slot}</span>
                        <span className={styles.bookingGroup}>{booking.group_name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Day Detail Modal (quest log popup) */}
        {dayDetailDate && (
          <DayDetailModal
            dateStr={dayDetailDate}
            bookings={getBookingsForDate(dayDetailDate)}
            onClose={() => setDayDetailDate(null)}
            onNewBooking={handleNewBookingFromDetail}
            onEdit={handleEditFromDetail}
            onDelete={handleDeleteFromDetail}
            canBook={isBookable(dayDetailDate)}
          />
        )}

        {/* Quest Reservation Modal */}
        {showModal && (
          <BookingModal
            editingBooking={editingBooking}
            selectedDate={selectedDate}
            bookings={bookings}
            onClose={handleModalClose}
            onSuccess={handleBookingSuccess}
          />
        )}

        {/* Cancel Quest Confirmation */}
        {deletingBooking && (
          <ConfirmModal
            message={`Are you sure you want to cancel this quest?\n\n⚔ ${deletingBooking.group_name}\n🕐 ${deletingBooking.time_slot}\n📜 ${deletingBooking.date}`}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDeletingBooking(null)}
            loading={deleteLoading}
          />
        )}
      </div>
    </div>
  );
}
